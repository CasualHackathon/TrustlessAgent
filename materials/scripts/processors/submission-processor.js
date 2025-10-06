const path = require('path');
const FileManager = require('../utils/file-manager');
const { parseIssueFields, parseFieldFromContent } = require('../utils/field-parser');
const UserManager = require('../services/user-manager');
const ReadmeManager = require('../services/readme-manager');
const GitManager = require('../utils/git-manager');
const { DIRECTORIES, FILE_NAMES, FIELD_NAMES, STATUS_INDICATORS } = require('../config/constants');

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

        // 简单验证：检查是否包含基本字段（不做复杂解析）
        if (!issueBody.includes('**Project Name**') || !issueBody.includes('**Project Members**') || !issueBody.includes('**Project Leader**')) {
            console.error('项目提交字段不全，缺少必填信息');
            process.exit(1);
        }

        // 从issue内容中提取项目名称（用于文件名）
        const projectNameMatch = issueBody.match(/\*\*Project Name\*\*[^>]*>([^\n]+)/);
        const projectName = projectNameMatch ? projectNameMatch[1].trim() : `Project-${Date.now()}`;

        // 直接保存原始issue内容
        this.createSubmissionFile(projectName, issueBody);

        // 更新提交表格
        this.updateSubmissionTable();

        // 提交到 Git
        const submissionFile = this.getSubmissionFilePath(projectName);
        const readmePath = ReadmeManager.getReadmePath();
        GitManager.commitWorkflow(
            `Add submission for ${projectName}`,
            submissionFile,
            readmePath
        );

        console.log('项目提交处理完成');
    }


    /**
     * 获取提交文件路径
     * @param {string} projectName - 项目名称
     * @returns {string} 提交文件路径
     */
    static getSubmissionFilePath(projectName) {
        const submissionDir = path.join(__dirname, DIRECTORIES.SUBMISSION);
        return path.join(submissionDir, `${projectName}.md`);
    }

    /**
     * 创建提交文件
     * @param {string} projectName - 项目名称
     * @param {string} originalIssueBody - 原始issue内容
     */
    static createSubmissionFile(projectName, originalIssueBody) {
        const submissionDir = path.join(__dirname, DIRECTORIES.SUBMISSION);
        FileManager.ensureDirectoryExists(submissionDir);

        const content = this.generateSubmissionFileContent(projectName, originalIssueBody);
        const filePath = this.getSubmissionFilePath(projectName);

        FileManager.writeFileContent(filePath, content);
        console.log(`项目信息已写入: ${filePath}`);
    }

    /**
     * 生成提交文件内容 - 直接保存原始issue内容，不做任何处理
     * @param {string} projectName - 项目名称
     * @param {string} originalIssueBody - 原始issue内容
     * @returns {string} 文件内容
     */
    static generateSubmissionFileContent(projectName, originalIssueBody) {
        // 直接返回原始issue内容，不做任何转换
        return originalIssueBody;
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

            // 从文件名获取项目名称（去掉.md扩展名）
            const projectName = file.replace('.md', '');

            // 尝试解析字段，解析失败则返回null（会被过滤掉）
            try {
                const parsedProjectName = parseFieldFromContent(content, FIELD_NAMES.SUBMISSION.PROJECT_NAME) || projectName;
                const projectDescription = parseFieldFromContent(content, FIELD_NAMES.SUBMISSION.PROJECT_DESCRIPTION);
                const projectMembers = parseFieldFromContent(content, FIELD_NAMES.SUBMISSION.PROJECT_MEMBERS);
                const projectLeader = parseFieldFromContent(content, FIELD_NAMES.SUBMISSION.PROJECT_LEADER);
                const repositoryUrl = parseFieldFromContent(content, FIELD_NAMES.SUBMISSION.REPOSITORY_URL);

                // 如果关键字段为空，跳过这个文件
                if (!parsedProjectName || !projectMembers || !projectLeader) {
                    console.log(`跳过文件 ${file}：缺少关键字段`);
                    return null;
                }

                return {
                    fileName: file,
                    projectName: parsedProjectName,
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

        rows.forEach((row, index) => {
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