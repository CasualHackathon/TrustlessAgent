const path = require('path');
const FileManager = require('./file-manager');
const { parseFieldFromContent } = require('./parser-manager');
const { DIRECTORIES, FIELD_NAMES } = require('../config/constants');

/**
 * 用户管理类
 * User management utilities
 */
class UserManager {
    /**
     * 获取用户注册信息文件路径
     * @param {string} githubUser - GitHub 用户名
     * @returns {string} 注册文件路径
     */
    static getRegistrationFilePath(githubUser) {
        const registrationDir = path.join(__dirname, DIRECTORIES.REGISTRATION);
        return path.join(registrationDir, `${githubUser}.md`);
    }

    /**
     * 验证用户是否已注册
     * @param {string} githubUser - GitHub 用户名
     * @returns {boolean} 是否已注册
     */
    static isUserRegistered(githubUser) {
        const registrationFile = this.getRegistrationFilePath(githubUser);
        return FileManager.readFileContent(registrationFile) !== '';
    }

}

module.exports = UserManager;