const path = require('path');
const FileManager = require('../utils/file-manager');
const { parseFieldFromContent } = require('../utils/parser-manager');
const UserManager = require('../utils/user-manager');
const ReadmeManager = require('../utils/readme-manager');
const FieldValidator = require('../utils/field-validator');
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

        // 验证必填字段
        FieldValidator.validateRequiredFields(issueBody, 'REGISTRATION');

        // 保存原始issue内容
        this.createRegistrationFile(githubUser, issueBody);

        // 更新 README 表格
        this.updateRegistrationTable();

        console.log('注册处理完成');
    }


    /**
     * 创建注册文件
     * @param {string} githubUser - GitHub 用户名
     * @param {string} originalIssueBody - 原始issue内容
     */
    static createRegistrationFile(githubUser, originalIssueBody) {
        const filePath = UserManager.getRegistrationFilePath(githubUser);
        FileManager.saveFile(filePath, originalIssueBody, '报名信息已写入');
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

            // 尝试解析字段，解析失败则跳过
            try {
                const name = parseFieldFromContent(content, FIELD_NAMES.REGISTRATION.NAME);
                const description = parseFieldFromContent(content, FIELD_NAMES.REGISTRATION.DESCRIPTION);
                const contact = parseFieldFromContent(content, FIELD_NAMES.REGISTRATION.CONTACT);
                const walletAddress = parseFieldFromContent(content, FIELD_NAMES.REGISTRATION.WALLET_ADDRESS);
                const teamWillingness = parseFieldFromContent(content, FIELD_NAMES.REGISTRATION.TEAM_WILLINGNESS);

                // 如果解析失败或关键字段为空，跳过这个文件
                if (!name || !contact || !walletAddress) {
                    console.log(`跳过文件 ${file}：解析失败或缺少关键字段`);
                    return null;
                }

                return {
                    name,
                    description,
                    contact,
                    walletAddress,
                    teamWillingness,
                    fileName: file
                };
            } catch (error) {
                console.log(`跳过文件 ${file}：解析失败 - ${error.message}`);
                return null;
            }
        }).filter(Boolean); // 过滤掉null值

        // 按姓名首字母升序排序
        rows.sort((a, b) => {
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });

        // 直接生成表格内容
        let table = '| Name | Description | Contact | Team Willingness | Operate |\n| ---- | ----------- | ------- | ---------------- | ------- |\n';

        rows.forEach((row) => {
            const issueTitle = `${GITHUB_CONFIG.ISSUE_TITLE_PREFIXES.REGISTRATION} - ${row.name}`;

            // 直接读取MD文件内容作为编辑链接的body
            const githubUser = row.fileName.replace('.md', '');
            const filePath = UserManager.getRegistrationFilePath(githubUser);
            const issueBody = FileManager.readFileContent(filePath);

            const issueUrl = ReadmeManager.generateIssueUrl(issueTitle, issueBody);

            table += `| ${row.name} | ${row.description} | ${row.contact} | ${row.teamWillingness} | [Edit](${issueUrl}) |\n`;
        });

        ReadmeManager.updateReadmeSection('REGISTRATION', table);
    }

}

module.exports = RegistrationProcessor;