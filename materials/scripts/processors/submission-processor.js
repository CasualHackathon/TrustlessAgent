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

        // 验证用户是否已注册
        const displayName = UserManager.getUserDisplayName(githubUser);

        // 解析字段
        const fields = parseIssueFields(issueBody);
        const submissionData = this.extractSubmissionData(fields, displayName);

        // 验证必填字段
        this.validateSubmissionData(submissionData);

        // 创建项目文件 - 直接以项目名为文件名
        this.createSubmissionFile(submissionData.projectName, issueBody);

        // 更新提交表格
        this.updateSubmissionTable();

        // 提交到 Git
        const submissionFile = this.getSubmissionFilePath(submissionData.projectName);
        const readmePath = ReadmeManager.getReadmePath();
        GitManager.commitWorkflow(
            `Add submission for ${submissionData.projectName}`,
            submissionFile,
            readmePath
        );

        console.log('项目提交处理完成');
    }

    /**
     * 从解析的字段中提取提交数据
     * @param {Object} fields - 解析的字段
     * @param {string} displayName - 用户显示名称
     * @returns {Object} 提交数据
     */
    static extractSubmissionData(fields, displayName) {
        return {
            projectName: fields[FIELD_NAMES.SUBMISSION.PROJECT_NAME] || '',
            projectDescription: fields[FIELD_NAMES.SUBMISSION.PROJECT_DESCRIPTION] || '',
            projectMembers: fields[FIELD_NAMES.SUBMISSION.PROJECT_MEMBERS] || displayName,
            projectLeader: fields[FIELD_NAMES.SUBMISSION.PROJECT_LEADER] || displayName,
            repositoryUrl: fields[FIELD_NAMES.SUBMISSION.REPOSITORY_URL] || ''
        };
    }

    /**
     * 验证提交数据
     * @param {Object} submissionData - 提交数据
     */
    static validateSubmissionData(submissionData) {
        const { projectName, projectMembers, projectLeader, repositoryUrl } = submissionData;

        if (!projectName || !projectMembers || !projectLeader || !repositoryUrl) {
            console.error('项目提交字段不全，缺少必填信息');
            process.exit(1);
        }
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
     * 生成提交文件内容 - 完全原封不动保存issue内容
     * @param {string} projectName - 项目名称
     * @param {string} originalIssueBody - 原始issue内容
     * @returns {string} 文件内容
     */
    static generateSubmissionFileContent(projectName, originalIssueBody) {
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
                if (!parsedProjectName || !projectMembers || !projectLeader || !repositoryUrl) {
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

        const tableContent = this.generateSubmissionTable(rows, submissionRoot);
        ReadmeManager.updateReadmeSection('SUBMISSION', tableContent);
    }

    /**
     * 生成提交表格内容
     * @param {Array} rows - 提交数据行
     * @param {string} submissionRoot - 提交根目录
     * @returns {string} 表格内容
     */
    static generateSubmissionTable(rows, submissionRoot) {
        let table = '| Project | Description | Members | Leader | Repository | Operate |\n| ----------- | ----------------- | -------------- | ------- | ---------- | -------- |\n';

        rows.forEach(row => {
            // 生成操作链接
            const issueTitle = `Submission - ${row.projectName}`;
            const issueBody = `## Project Submission Form\n\n**${FIELD_NAMES.SUBMISSION.PROJECT_NAME}:**\n\n${row.projectName}\n\n**${FIELD_NAMES.SUBMISSION.PROJECT_DESCRIPTION}:**\n\n${row.projectDescription}\n\n**${FIELD_NAMES.SUBMISSION.PROJECT_MEMBERS}:**\n\n${row.projectMembers}\n\n**${FIELD_NAMES.SUBMISSION.PROJECT_LEADER}:**\n\n${row.projectLeader}\n\n**${FIELD_NAMES.SUBMISSION.REPOSITORY_URL}:**\n\n${row.repositoryUrl}`;
            const issueUrl = ReadmeManager.generateIssueUrl(issueTitle, issueBody);
            const fileUrl = ReadmeManager.generateFileUrl(`submission/${row.fileName}`);

            // 生成仓库链接
            const repoLink = row.repositoryUrl ? `[🔗](${row.repositoryUrl})` : 'N/A';

            table += `| ${row.projectName} | ${row.projectDescription} | ${row.projectMembers} | ${row.projectLeader} | ${repoLink} | [Edit](${issueUrl}) &#124; [File](${fileUrl}) |\n`;
        });

        return table;
    }
}

module.exports = SubmissionProcessor;