const { updateSubmissionTable } = require('./submission_table');

// 更新 Submission 表格
updateSubmissionTable();

// 配置 git 并提交
const { execSync } = require('child_process');
const readmePath = require('path').join(__dirname, '../README.md');

execSync('git config --local user.email "action@github.com"');
execSync('git config --local user.name "GitHub Action"');
execSync(`git add ${readmePath}`);
try {
    execSync('git diff --cached --quiet');
    console.log('没有需要提交的更改');
} catch {
    execSync('git commit -m "🤖 Auto-update: Update submission status table"');
    execSync('git push');
}