const fs = require('fs');
const path = require('path');
const { updateSubmissionTable } = require('./submission_table');

// 通用字段解析方法
function parseFieldFromFile(filePath, fieldName) {
    if (!fs.existsSync(filePath)) {
        return '';
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const pattern = `**${fieldName}**:`;
    for (const line of lines) {
        if (line.startsWith(pattern)) {
            return line.slice(pattern.length).replace(/\s+$/, '').trim();
        }
    }
    return '';
}

// 获取 githubUser 对应的报名姓名
function getDisplayName(githubUser) {
    const registrationDir = path.join(__dirname, '../registration');
    const regFile = path.join(registrationDir, `${githubUser}.md`);
    if (!fs.existsSync(regFile)) {
        console.error(`用户 ${githubUser} 未在 registration 中完成注册，请先完成报名`);
        process.exit(1);
    }
    return parseFieldFromFile(regFile, 'Name[姓名]') || githubUser;
}

// 从环境变量获取 issue body
const body = process.env.ISSUE_BODY || `ProjectName[项目名称]:projectName

Brief description about your project in one sentence（简要描述您的项目）
ProjectDescription[项目描述]:ProjectDescription

 Your wallet address or ENS domain on Ethereum mainnet（您在以太坊主网上的钱包地址或 ENS 域名）
WalletAddress[钱包地址]:test.eth`;
const githubUser = process.env.ISSUE_USER || 'githubUser';

// 预处理：去除每一行的前后空格
const cleanBody = body
    .split('\n')
    .map(line => line.trim())
    .join('\n');

function parseFields(bodyStr) {
    const lines = bodyStr.split('\n');
    const fields = {};
    for (const line of lines) {
        const idx = line.indexOf(':') !== -1 ? line.indexOf(':') : line.indexOf('：');
        if (idx !== -1) {
            const key = line.slice(0, idx).trim();
            const value = line.slice(idx + 1).trim();
            fields[key] = value;
        }
    }
    return fields;
}

const displayName = getDisplayName(githubUser);
const fields = parseFields(cleanBody);
const projectName = fields['ProjectName[项目名称]'] || '';
const projectDescription = fields['ProjectDescription[项目描述]'] || '';
const projectMembers = fields['ProjectMembers[项目成员]'] || displayName;
const walletAddress = fields['WalletAddress[钱包地址]'] || '';

if (!projectName || !walletAddress) {
    console.error('字段不全');
    process.exit(1);
}


// 检查是否已有提交记录，如果有则验证是否为本人操作
const submissionDir = path.join(__dirname, '../submission', `${githubUser}`);
const existingHackathonFile = path.join(submissionDir, 'HACKATHON.md');

if (fs.existsSync(existingHackathonFile)) {
    const existingGithubUser = parseFieldFromFile(existingHackathonFile, 'githubUser');
    if (existingGithubUser && existingGithubUser !== githubUser) {
        console.error(`权限错误：用户 ${githubUser} 试图修改 ${existingGithubUser} 的项目提交，操作被拒绝`);
        process.exit(1);
    }
}

if (!fs.existsSync(submissionDir)) {
    fs.mkdirSync(submissionDir, { recursive: true });
}
const filename = path.join(submissionDir, 'HACKATHON.md');
const content = `# ${projectName}\n\n**Name**: ${displayName}  \n**githubUser**: ${githubUser}  \n**Project**: ${projectName}  \n**Description**: ${projectDescription}  \n**Members**: ${projectMembers}\n**WalletAddress**: ${walletAddress}`;
fs.writeFileSync(filename, content, 'utf8');
console.log(`项目信息已写入: ${filename}`);

// 自动更新 README.md 的 Submission 区域表格
updateSubmissionTable();

// 配置 git 并提交
const readmePath = path.join(__dirname, '../README.md');
const { execSync } = require('child_process');
execSync('git config --local user.email "action@github.com"');
execSync('git config --local user.name "GitHub Action"');
execSync(`git add ${filename} ${readmePath}`);
try {
    execSync('git diff --cached --quiet');
    console.log('没有需要提交的更改');
} catch {
    execSync(`git commit -m "Add submission for ${githubUser}@${projectName}"`);
    execSync('git push');
}