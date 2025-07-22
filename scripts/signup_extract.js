const fs = require('fs');
const path = require('path');

// 从环境变量获取 issue body
const body = process.env.ISSUE_BODY || `Name[姓名]:name

Brief personal introduction including skills and experience (One sentence)[简短介绍个人技能与经验]
Description[个人介绍]:description

Telegram | WeChat | Discord | Email | X(Twitter) | GitHub
ContactMethod[联系方式]:contactMethod

e.g., @username, email@example.com
Contact[联系账号]:contact`;
const githubUser = process.env.ISSUE_USER || 'githubUser';

// 调试：打印每一行内容及其字符编码
body.split('\n').forEach((line, idx) => {
    console.log(`第${idx+1}行:`, JSON.stringify(line));
});
console.log('body.includes("Name[姓名]"):', body.includes('Name[姓名]'));

// 预处理：去除每一行的前后空格
const cleanBody = body
    .split('\n')
    .map(line => line.trim())
    .join('\n');

// 调试：打印处理后的 body
console.log('处理后的 ISSUE_BODY 内容如下:\n', cleanBody);

// 处理：将 cleanBody 按行分割为数组，并用第一个冒号分割为 key-value
function parseFields(bodyStr) {
    const lines = bodyStr.split('\n');
    const fields = {};
    for (const line of lines) {
        // 支持中英文冒号
        const idx = line.indexOf(':') !== -1 ? line.indexOf(':') : line.indexOf('：');
        if (idx !== -1) {
            const key = line.slice(0, idx).trim();
            const value = line.slice(idx + 1).trim();
            fields[key] = value;
        }
    }
    return fields;
}

const fields = parseFields(cleanBody);

const name = fields['Name[姓名]'] || '';
const description = fields['Description[个人介绍]'] || '';
const contactMethod = fields['ContactMethod[联系方式]'] || '';
const contact = fields['Contact[联系账号]'] || '';

if (!name || !githubUser || !contact || !contactMethod) {
    console.error('字段不全');
    process.exit(1);
}

const content = `# ${githubUser}\n\n**Name[姓名]**: ${name}  \n**Description[个人介绍]**: ${description}  \n**ContactMethod[联系方式]**: ${contactMethod}  \n**Contact[联系账号]**: ${contact}\n`;

const regDir = path.join(__dirname, '../registration');
if (!fs.existsSync(regDir)) {
    fs.mkdirSync(regDir);
}

const filename = path.join(regDir, `${githubUser}.md`);
fs.writeFileSync(filename, content, 'utf8');
console.log(`报名信息已写入: ${filename}`);

// 新增：自动更新 README.md 的报名表
const readmePath = path.join(__dirname, '../README.md');

function parseField(content, label) {
    const lines = content.split('\n');
    const pattern = `**${label}**:`;
    for (const line of lines) {
        if (line.startsWith(pattern)) {
            // 提取冒号后内容，并去除所有行尾空白
            return line.slice(pattern.length).replace(/\s+$/, '').trim();
        }
    }
    return '';
}

// 1. 读取所有报名文件
const files = fs.existsSync(regDir) ? fs.readdirSync(regDir).filter(f => f.endsWith('.md')) : [];
const rows = files.map(file => {
    const content = fs.readFileSync(path.join(regDir, file), 'utf8');
    return {
        name: parseField(content, 'Name[姓名]'),
        description: parseField(content, 'Description[个人介绍]'),
        contactMethod: parseField(content, 'ContactMethod[联系方式]'),
        contact: parseField(content, 'Contact[联系账号]'),
    };
});

console.log('rows==>', rows);

// 2. 生成 table
const repoUrl = 'https://github.com/CasualHackathon/Template'; // TODO: 替换为你的仓库地址
let table = '| Name | Description | Contact | Operate |\n| ---- | ----------- | ------- | ------- |\n';
rows.forEach(r => {
    // 预填内容
    const issueTitle = encodeURIComponent(`Registration - ${r.name}`);
    const issueBody = encodeURIComponent(
        `Name[姓名]: ${r.name}\nDescription[个人介绍]: ${r.description}\nContactMethod[联系方式]: ${r.contactMethod}\nContact[联系账号]: ${r.contact}`
    );
    const issueUrl = `${repoUrl}/issues/new?title=${issueTitle}&body=${issueBody}`;
    table += `| ${r.name} | ${r.description} | ${r.contact}(${r.contactMethod}) | [Edit](${issueUrl}) |\n`;
});

// 3. 替换 README.md 中 Registration 区域
let readme = fs.readFileSync(readmePath, 'utf8');
readme = readme.replace(
    /(<!-- Registration star -->)[\s\S]*?(<!-- Registration end -->)/,
    `$1\n${table}\n$2`
);
fs.writeFileSync(readmePath, readme, 'utf8');
console.log('README.md Registration 区域已更新');

// 配置 git 并提交
const { execSync } = require('child_process');
execSync('git config --local user.email "action@github.com"');
execSync('git config --local user.name "GitHub Action"');
execSync(`git add ${filename} ${readmePath}`);
try {
    execSync('git diff --cached --quiet'); // 没有变更会返回 0
    console.log('没有需要提交的更改');
} catch {
    execSync(`git commit -m "Add registration for ${name}"`);
    execSync('git push');
}

// 输出信息供后续步骤使用
toOutput('name', name);
toOutput('description', description);
toOutput('contact_method', contactMethod);
toOutput('contact', contact);

function toOutput(key, value) {
    // 兼容 github actions 的输出
    fs.appendFileSync(process.env.GITHUB_OUTPUT || '/dev/null', `${key}=${value}\n`);
}