const path = require('path');
const FileManager = require('../utils/file-manager');
const { parseFieldFromContent } = require('../utils/parser-manager');
const UserManager = require('../utils/user-manager');
const ReadmeManager = require('../utils/readme-manager');
const FieldValidator = require('../utils/field-validator');
const { DIRECTORIES, FILE_NAMES, FIELD_NAMES } = require('../config/constants');

/**
 * 项目提交处理器
 * Submission processor
 */
class SubmissionProcessor {
    /**
     * 处理项目提交
     * @param {string} issueBody - Issue 内容
     * @param {string} githubUser - GitHub 用户名
     */
    static processSubmission(issueBody, githubUser) {
        console.log('开始处理项目提交...');

        // 检查用户是否已注册
        FieldValidator.checkUserRegistration(githubUser, UserManager, FileManager);

        // 验证必填字段
        FieldValidator.validateRequiredFields(issueBody, 'SUBMISSION');

        // 保存原始issue内容
        this.createSubmissionFile(issueBody, githubUser);

        // 更新提交表格
        this.updateSubmissionTable();

        console.log('项目提交处理完成');
    }


    /**
     * 获取提交文件路径
     * @param {string} githubUser - GitHub 用户名
     * @returns {string} 提交文件路径
     */
    static getSubmissionFilePath(githubUser) {
        const submissionDir = path.join(__dirname, DIRECTORIES.SUBMISSION);
        return path.join(submissionDir, `${githubUser}.md`);
    }

    /**
     * 创建提交文件
     * @param {string} originalIssueBody - 原始issue内容
     * @param {string} githubUser - GitHub 用户名
     */
    static createSubmissionFile(originalIssueBody, githubUser) {
        // 创建提交文件，使用 GitHub 用户名作为文件名
        const filePath = this.getSubmissionFilePath(githubUser);
        FileManager.saveFile(filePath, originalIssueBody, '项目提交信息已写入');
    }

    /**
     * 更新提交表格
     */
    static updateSubmissionTable() {
        const submissionRoot = path.join(__dirname, DIRECTORIES.SUBMISSION);
        const submissionFiles = FileManager.getDirectoryFiles(submissionRoot, '.md');

        const rows = submissionFiles.map(file => {
            const submissionFile = path.join(submissionRoot, file);
            const content = FileManager.readFileContent(submissionFile);

            if (!content) return null;

            // 从文件名获取 GitHub 用户名（去掉.md扩展名）
            const githubUser = file.replace('.md', '');

            // 尝试解析字段，解析失败则跳过
            try {
                const projectName = parseFieldFromContent(content, FIELD_NAMES.SUBMISSION.PROJECT_NAME);
                const projectDescription = parseFieldFromContent(content, FIELD_NAMES.SUBMISSION.PROJECT_DESCRIPTION);
                const projectMembers = parseFieldFromContent(content, FIELD_NAMES.SUBMISSION.PROJECT_MEMBERS);
                const projectLeader = parseFieldFromContent(content, FIELD_NAMES.SUBMISSION.PROJECT_LEADER);
                const repositoryUrl = parseFieldFromContent(content, FIELD_NAMES.SUBMISSION.REPOSITORY_URL);

                // 如果解析失败或关键字段为空，跳过这个文件
                if (!projectName || !projectDescription || !projectLeader) {
                    console.log(`跳过文件 ${file}：解析失败或缺少关键字段`);
                    return null;
                }

                return {
                    fileName: file,
                    githubUser: githubUser,
                    projectName: projectName,
                    projectDescription,
                    projectMembers,
                    projectLeader,
                    repositoryUrl
                };
            } catch (error) {
                console.log(`跳过文件 ${file}：解析失败 - ${error.message}`);
                return null;
            }
        }).filter(Boolean);

        // 按项目名称首字母升序排序
        rows.sort((a, b) => {
            const nameA = (a.projectName || '').toLowerCase();
            const nameB = (b.projectName || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });

        // 直接生成表格内容
        let table = '| Project | Description | Members | Leader | Repository | Operate |\n| ----------- | ----------------- | -------------- | ------- | ---------- | -------- |\n';

        rows.forEach((row) => {
            const issueTitle = `Submission - ${row.projectName}`;

            // 直接读取MD文件内容作为编辑链接的body
            const filePath = path.join(submissionRoot, row.fileName);
            const issueBody = FileManager.readFileContent(filePath);

            const issueUrl = ReadmeManager.generateIssueUrl(issueTitle, issueBody);

            // 生成仓库链接：存在显示🔗，不存在显示❌
            const repoLink = row.repositoryUrl && row.repositoryUrl.trim() !== '' ? `[🔗](${row.repositoryUrl})` : '❌';

            table += `| ${row.projectName} | ${row.projectDescription} | ${row.projectMembers} | ${row.projectLeader} | ${repoLink} | [Edit](${issueUrl}) |\n`;
        });

        ReadmeManager.updateReadmeSection('SUBMISSION', table);
    }
}

module.exports = SubmissionProcessor;