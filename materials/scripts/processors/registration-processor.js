const path = require('path');
const FileManager = require('../utils/file-manager');
const { parseIssueFields } = require('../utils/field-parser');
const { parseFieldFromContent } = require('../utils/field-parser');
const UserManager = require('../services/user-manager');
const ReadmeManager = require('../services/readme-manager');
const GitManager = require('../utils/git-manager');
const { DIRECTORIES, FIELD_NAMES, GITHUB_CONFIG } = require('../config/constants');

/**
 * 注册处理器
 * Registration processor
 */
class RegistrationProcessor {
    /**
     * 处理注册请求
     * @param {string} issueBody - Issue 内容
     * @param {string} githubUser - GitHub 用户名
     */
    static processRegistration(issueBody, githubUser) {
        console.log('开始处理注册请求...');

        // 解析字段用于验证
        const fields = parseIssueFields(issueBody);
        const registrationData = this.extractRegistrationData(fields);

        // 验证必填字段
        this.validateRegistrationData(registrationData, githubUser);

        // 创建注册文件 - 直接保存原始issue内容
        this.createRegistrationFile(githubUser, issueBody);

        // 更新 README 表格
        this.updateRegistrationTable();

        // 提交到 Git
        const registrationFile = UserManager.getRegistrationFilePath(githubUser);
        const readmePath = ReadmeManager.getReadmePath();
        GitManager.commitWorkflow(
            `Add registration for ${githubUser}`,
            registrationFile,
            readmePath
        );

        // 输出环境变量供后续步骤使用
        this.outputEnvironmentVariables(registrationData);

        console.log('注册处理完成');
    }

    /**
     * 从解析的字段中提取注册数据
     * @param {Object} fields - 解析的字段
     * @returns {Object} 注册数据
     */
    static extractRegistrationData(fields) {
        return {
            name: fields[FIELD_NAMES.REGISTRATION.NAME] || '',
            description: fields[FIELD_NAMES.REGISTRATION.DESCRIPTION] || '',
            contact: fields[FIELD_NAMES.REGISTRATION.CONTACT] || '',
            walletAddress: fields[FIELD_NAMES.REGISTRATION.WALLET_ADDRESS] || '',
            teamWillingness: fields[FIELD_NAMES.REGISTRATION.TEAM_WILLINGNESS] || ''
        };
    }

    /**
     * 验证注册数据
     * @param {Object} registrationData - 注册数据
     * @param {string} githubUser - GitHub 用户名
     */
    static validateRegistrationData(registrationData, githubUser) {
        const { name, contact, walletAddress } = registrationData;

        if (!name || !githubUser || !contact || !walletAddress) {
            console.error('注册字段不全，缺少必填信息');
            process.exit(1);
        }
    }

    /**
     * 创建注册文件
     * @param {string} githubUser - GitHub 用户名
     * @param {string} originalIssueBody - 原始issue内容
     */
    static createRegistrationFile(githubUser, originalIssueBody) {
        const registrationDir = path.join(__dirname, DIRECTORIES.REGISTRATION);
        FileManager.ensureDirectoryExists(registrationDir);

        const content = this.generateRegistrationFileContent(githubUser, originalIssueBody);
        const filePath = UserManager.getRegistrationFilePath(githubUser);

        FileManager.writeFileContent(filePath, content);
        console.log(`报名信息已写入: ${filePath}`);
    }

    /**
     * 生成注册文件内容 - 完全原封不动保存issue内容
     * @param {string} githubUser - GitHub 用户名
     * @param {string} originalIssueBody - 原始issue内容
     * @returns {string} 文件内容
     */
    static generateRegistrationFileContent(githubUser, originalIssueBody) {
        return originalIssueBody;
    }

    /**
     * 更新注册表格
     */
    static updateRegistrationTable() {
        const registrationDir = path.join(__dirname, DIRECTORIES.REGISTRATION);
        const files = FileManager.getDirectoryFiles(registrationDir, '.md');

        const rows = files.map(file => {
            const filePath = path.join(registrationDir, file);
            const content = FileManager.readFileContent(filePath);

            // 尝试解析字段，解析失败则返回null（会被过滤掉）
            try {
                const name = parseFieldFromContent(content, FIELD_NAMES.REGISTRATION.NAME);
                const description = parseFieldFromContent(content, FIELD_NAMES.REGISTRATION.DESCRIPTION);
                const contact = parseFieldFromContent(content, FIELD_NAMES.REGISTRATION.CONTACT);
                const walletAddress = parseFieldFromContent(content, FIELD_NAMES.REGISTRATION.WALLET_ADDRESS);
                const teamWillingness = parseFieldFromContent(content, FIELD_NAMES.REGISTRATION.TEAM_WILLINGNESS);

                // 如果关键字段为空，跳过这个文件
                if (!name || !contact || !walletAddress) {
                    console.log(`跳过文件 ${file}：缺少关键字段`);
                    return null;
                }

                return {
                    name,
                    description,
                    contact,
                    walletAddress,
                    teamWillingness
                };
            } catch (error) {
                console.log(`跳过文件 ${file}：解析失败 - ${error.message}`);
                return null;
            }
        }).filter(Boolean); // 过滤掉null值

        // 按项目名称首字母升序排序
        rows.sort((a, b) => {
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });

        const tableContent = this.generateRegistrationTable(rows);
        ReadmeManager.updateReadmeSection('REGISTRATION', tableContent);
    }

    /**
     * 生成注册表格内容
     * @param {Array} rows - 注册数据行
     * @returns {string} 表格内容
     */
    static generateRegistrationTable(rows) {
        let table = '| Name | Description | Contact | Team Willingness | Operate |\n| ---- | ----------- | ------- | ---------------- | ------- |\n';

        rows.forEach(row => {
            const issueTitle = `${GITHUB_CONFIG.ISSUE_TITLE_PREFIXES.REGISTRATION} - ${row.name}`;
            const issueBody = `## Registration Form\n\n**${FIELD_NAMES.REGISTRATION.NAME}:**\n\n${row.name}\n\n**${FIELD_NAMES.REGISTRATION.DESCRIPTION}:**\n\n${row.description}\n\n**${FIELD_NAMES.REGISTRATION.CONTACT}:**\n\n${row.contact}\n\n**${FIELD_NAMES.REGISTRATION.WALLET_ADDRESS}:**\n\n${row.walletAddress}\n\n**${FIELD_NAMES.REGISTRATION.TEAM_WILLINGNESS}:**\n\n${row.teamWillingness}`;
            const issueUrl = ReadmeManager.generateIssueUrl(issueTitle, issueBody);

            table += `| ${row.name} | ${row.description} | ${row.contact} | ${row.teamWillingness} | [Edit](${issueUrl}) |\n`;
        });

        return table;
    }

    /**
     * 输出环境变量
     * @param {Object} registrationData - 注册数据
     */
    static outputEnvironmentVariables(registrationData) {
        const outputFile = process.env.GITHUB_OUTPUT || '/dev/null';

        Object.entries(registrationData).forEach(([key, value]) => {
            FileManager.writeFileContent(outputFile, `${key}=${value}\n`);
        });
    }
}

module.exports = RegistrationProcessor;