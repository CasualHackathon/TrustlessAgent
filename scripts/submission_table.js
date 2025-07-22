const fs = require('fs');
const path = require('path');

function getDisplayName(githubUser) {
    const registrationDir = path.join(__dirname, '../registration');
    const regFile = path.join(registrationDir, `${githubUser}.md`);
    if (fs.existsSync(regFile)) {
        const regContent = fs.readFileSync(regFile, 'utf8');
        const lines = regContent.split('\n');
        const pattern = `**Name[姓名]**:`;
        for (const line of lines) {
            if (line.startsWith(pattern)) {
                return line.slice(pattern.length).replace(/\s+$/, '').trim();
            }
        }
    }
    return githubUser;
}

function updateSubmissionTable() {
    const submissionRoot = path.join(__dirname, '../submission');
    const folders = fs.existsSync(submissionRoot) ? fs.readdirSync(submissionRoot).filter(f => fs.statSync(path.join(submissionRoot, f)).isDirectory()) : [];
    const rows = folders.map(folder => {
        const file = path.join(submissionRoot, folder, 'HACKATHON.md');
        if (!fs.existsSync(file)) return null;
        const content = fs.readFileSync(file, 'utf8');

        function parseField(content, label) {
            const lines = content.split('\n');
            const pattern = `**${label}**:`;
            for (const line of lines) {
                if (line.startsWith(pattern)) {
                    return line.slice(pattern.length).replace(/\s+$/, '').trim();
                }
            }
            return '';
        }
        // 重新查找 displayName
        const folderDisplayName = getDisplayName(folder);
        return {
            folder: folder,
            name: folderDisplayName,
            projectName: parseField(content, 'Project'),
            projectDescription: parseField(content, 'Description'),
            projectMembers: parseField(content, 'Members'),
        };
    }).filter(Boolean);

    const readmePath = path.join(__dirname, '../README.md');
    const repoUrl = 'https://github.com/CasualHackathon/Template'; // TODO: 替换为你的仓库地址
    // | Name 
    // ---- |
    let table = '| Project | Description | Members | Submitted | Operate |\n| ----------- | ----------------- | -------------- | ------ | -------- |\n';
    rows.forEach(r => {
        // 判断项目资源文件夹是否有内容，使用 folder
        const submissionDir = path.join(submissionRoot, r.folder);
        let submitted = '⚪ ';
        if (fs.existsSync(submissionDir)) {
            const files = fs.readdirSync(submissionDir).filter(f => f !== '.DS_Store' && f !== 'HACKATHON.md');
            if (files.length > 0) submitted = '🟢';
        }
        const issueBody = encodeURIComponent(
            `ProjectName[项目名称]:${r.projectName}\nProjectDescription[项目描述]:${r.projectDescription}\nProjectMembers[项目成员]:${r.projectMembers}\nWalletAddress[钱包地址]:${r.walletAddress}`
        );
        const issueTitle = encodeURIComponent(`Submission - ${r.projectName}`);
        const issueUrl = `${repoUrl}/issues/new?title=${issueTitle}&body=${issueBody}`;
        // | ${r.name} 
        table += `| ${r.projectName} | ${r.projectDescription} | ${r.projectMembers} | ${submitted} | [Edit](${issueUrl}) &#124; [Folder](${repoUrl}/tree/main/submission/${r.folder}) |
`;
    });

    let readme = fs.readFileSync(readmePath, 'utf8');
    readme = readme.replace(
        /(<!-- Submission start -->)[\s\S]*?(<!-- Submission end -->)/,
        `$1\n${table}\n$2`
    );
    fs.writeFileSync(readmePath, readme, 'utf8');
    console.log('README.md Submission 区域已更新');
}

module.exports = { updateSubmissionTable };