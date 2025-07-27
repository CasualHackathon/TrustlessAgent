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
        
        // 创建项目文件
        this.createSubmissionFile(githubUser, submissionData);
        
        // 更新提交表格
        this.updateSubmissionTable();
        
        // 提交到 Git
        const submissionFile = this.getSubmissionFilePath(githubUser);
        const readmePath = ReadmeManager.getReadmePath();
        GitManager.commitWorkflow(
            `Add submission for ${githubUser}@${submissionData.projectName}`,
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
            walletAddress: fields[FIELD_NAMES.SUBMISSION.WALLET_ADDRESS] || ''
        };
    }

    /**
     * 验证提交数据
     * @param {Object} submissionData - 提交数据
     */
    static validateSubmissionData(submissionData) {
        const { projectName, walletAddress, projectMembers } = submissionData;
        
        if (!projectName || !walletAddress || !projectMembers) {
            console.error('项目提交字段不全，缺少必填信息');
            process.exit(1);
        }
    }

    /**
     * 获取提交文件路径
     * @param {string} githubUser - GitHub 用户名
     * @returns {string} 提交文件路径
     */
    static getSubmissionFilePath(githubUser) {
        const submissionDir = path.join(__dirname, DIRECTORIES.SUBMISSION, githubUser);
        return path.join(submissionDir, FILE_NAMES.HACKATHON_INFO);
    }

    /**
     * 创建提交文件
     * @param {string} githubUser - GitHub 用户名
     * @param {Object} submissionData - 提交数据
     */
    static createSubmissionFile(githubUser, submissionData) {
        const submissionDir = path.join(__dirname, DIRECTORIES.SUBMISSION, githubUser);
        FileManager.ensureDirectoryExists(submissionDir);
        
        const content = this.generateSubmissionFileContent(githubUser, submissionData);
        const filePath = this.getSubmissionFilePath(githubUser);
        
        FileManager.writeFileContent(filePath, content);
        console.log(`项目信息已写入: ${filePath}`);
    }

    /**
     * 生成提交文件内容
     * @param {string} githubUser - GitHub 用户名
     * @param {Object} submissionData - 提交数据
     * @returns {string} 文件内容
     */
    static generateSubmissionFileContent(githubUser, submissionData) {
        const displayName = UserManager.getUserDisplayName(githubUser);
        const { projectName, projectDescription, projectMembers, walletAddress } = submissionData;
        
        return `# ${projectName}

**Name**: ${displayName}  
**githubUser**: ${githubUser}  
**Project**: ${projectName}  
**Description**: ${projectDescription}  
**Members**: ${projectMembers}
**WalletAddress**: ${walletAddress}`;
    }

    /**
     * 更新提交表格
     */
    static updateSubmissionTable() {
        const submissionRoot = path.join(__dirname, DIRECTORIES.SUBMISSION);
        const userFolders = FileManager.getSubDirectories(submissionRoot);
        
        const rows = userFolders.map(folder => {
            const submissionFile = path.join(submissionRoot, folder, FILE_NAMES.HACKATHON_INFO);
            const content = FileManager.readFileContent(submissionFile);
            
            if (!content) return null;
            
            const displayName = UserManager.getUserDisplayName(folder);
            
            return {
                folder: folder,
                name: displayName,
                projectName: parseFieldFromContent(content, 'Project'),
                projectDescription: parseFieldFromContent(content, 'Description'),
                projectMembers: parseFieldFromContent(content, 'Members'),
                walletAddress: parseFieldFromContent(content, 'WalletAddress')
            };
        }).filter(Boolean);

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
        let table = '| Project | Description | Members | Submitted | Operate |\n| ----------- | ----------------- | -------------- | ------ | -------- |\n';
        
        rows.forEach(row => {
            // 检查项目是否已提交文件
            const submissionDir = path.join(submissionRoot, row.folder);
            const files = FileManager.getDirectoryFiles(submissionDir)
                .filter(file => file !== '.DS_Store' && file !== FILE_NAMES.HACKATHON_INFO);
            
            const submitted = files.length > 0 ? STATUS_INDICATORS.SUBMITTED : STATUS_INDICATORS.NOT_SUBMITTED;
            
            // 生成操作链接
            const issueTitle = `Submission - ${row.projectName}`;
            const issueBody = `${FIELD_NAMES.SUBMISSION.PROJECT_NAME}:${row.projectName}\n${FIELD_NAMES.SUBMISSION.PROJECT_DESCRIPTION}:${row.projectDescription}\n${FIELD_NAMES.SUBMISSION.PROJECT_MEMBERS}:${row.projectMembers}\n${FIELD_NAMES.SUBMISSION.WALLET_ADDRESS}:${row.walletAddress}`;
            const issueUrl = ReadmeManager.generateIssueUrl(issueTitle, issueBody);
            const folderUrl = ReadmeManager.generateFolderUrl(`submission/${row.folder}`);
            
            table += `| ${row.projectName} | ${row.projectDescription} | ${row.projectMembers} | ${submitted} | [Edit](${issueUrl}) &#124; [Folder](${folderUrl}) |\n`;
        });
        
        return table;
    }
}

module.exports = SubmissionProcessor;