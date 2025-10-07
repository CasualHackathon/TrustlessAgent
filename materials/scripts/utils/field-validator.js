/**
 * 字段验证工具类
 * Field validation utilities
 */

const { parseFieldFromContent } = require('./parser-manager');
const { REQUIRED_FIELDS } = require('../config/constants');

class FieldValidator {
    /**
     * 验证必填字段
     * @param {string} issueBody - Issue 内容
     * @param {string} type - 类型 (REGISTRATION 或 SUBMISSION)
     * @returns {void} 验证通过则继续，失败则抛出错误
     */
    static validateRequiredFields(issueBody, type) {
        const requiredFields = REQUIRED_FIELDS[type];
        if (!requiredFields) {
            throw new Error(`未知的类型: ${type}`);
        }

        const missingFields = [];

        for (const fieldName of requiredFields) {
            const value = parseFieldFromContent(issueBody, fieldName);
            if (!value || value.trim() === '') {
                missingFields.push(fieldName);
            }
        }

        if (missingFields.length > 0) {
            const errorMessage = this.generateValidationErrorMessage(type, missingFields);

            // 将错误信息写入环境变量，供工作流使用
            if (process.env.GITHUB_OUTPUT) {
                const fs = require('fs');
                fs.appendFileSync(process.env.GITHUB_OUTPUT, `error_message<<EOF\n${errorMessage}\nEOF\n`);
            }
            // 同时输出到控制台
            console.error('ERROR_MESSAGE:', errorMessage);

            throw new Error(`字段验证失败: ${missingFields.join(', ')}`);
        }
    }

    /**
     * 生成字段验证错误信息
     * @param {string} type - 类型
     * @param {Array} missingFields - 缺失的字段
     * @returns {string} 错误信息
     */
    static generateValidationErrorMessage(type, missingFields) {
        let errorMessage = `❌ **字段验证失败**\n\n`;
        errorMessage += `**缺失的必填字段:** ${missingFields.join(', ')}\n\n`;
        errorMessage += `请填写所有必填字段后重新提交。`;

        return errorMessage;
    }

    /**
     * 检查用户是否已注册
     * @param {string} githubUser - GitHub 用户名
     * @param {Object} UserManager - 用户管理器
     * @param {Object} FileManager - 文件管理器
     * @returns {void} 已注册则继续，未注册则抛出错误
     */
    static checkUserRegistration(githubUser, UserManager, FileManager) {
        const registrationFile = UserManager.getRegistrationFilePath(githubUser);
        const isRegistered = FileManager.fileExists(registrationFile);

        if (!isRegistered) {
            const errorMessage = `❌ **用户未注册**\n\n` +
                `用户 \`${githubUser}\` 尚未注册参加黑客松。`;

            // 将错误信息写入环境变量，供工作流使用
            if (process.env.GITHUB_OUTPUT) {
                const fs = require('fs');
                fs.appendFileSync(process.env.GITHUB_OUTPUT, `error_message<<EOF\n${errorMessage}\nEOF\n`);
            }
            // 同时输出到控制台
            console.error('ERROR_MESSAGE:', errorMessage);

            throw new Error(`用户 ${githubUser} 未注册`);
        }
    }
}

module.exports = FieldValidator;