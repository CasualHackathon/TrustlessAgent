const fs = require('fs');
const path = require('path');

/**
 * 文件操作工具类
 * File operations utilities
 */
class FileManager {
    /**
     * 确保目录存在，不存在则创建
     * @param {string} dirPath - 目录路径
     */
    static ensureDirectoryExists(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    /**
     * 安全读取文件内容
     * @param {string} filePath - 文件路径
     * @returns {string} 文件内容，文件不存在返回空字符串
     */
    static readFileContent(filePath) {
        try {
            return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
        } catch (error) {
            console.error(`读取文件失败: ${filePath}`, error.message);
            return '';
        }
    }

    /**
     * 安全写入文件内容
     * @param {string} filePath - 文件路径
     * @param {string} content - 文件内容
     */
    static writeFileContent(filePath, content) {
        try {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`文件写入成功: ${filePath}`);
        } catch (error) {
            console.error(`文件写入失败: ${filePath}`, error.message);
            throw error;
        }
    }

    /**
     * 获取目录下的所有文件
     * @param {string} dirPath - 目录路径
     * @param {string} extension - 文件扩展名过滤，如 '.md'
     * @returns {Array} 文件路径数组
     */
    static getDirectoryFiles(dirPath, extension = '') {
        if (!fs.existsSync(dirPath)) {
            return [];
        }

        try {
            return fs.readdirSync(dirPath)
                .filter(file => !extension || file.endsWith(extension))
                .filter(file => file !== '.DS_Store'); // 过滤系统文件
        } catch (error) {
            console.error(`读取目录失败: ${dirPath}`, error.message);
            return [];
        }
    }

    /**
     * 获取目录下的所有子目录
     * @param {string} dirPath - 目录路径
     * @returns {Array} 子目录名称数组
     */
    static getSubDirectories(dirPath) {
        if (!fs.existsSync(dirPath)) {
            return [];
        }

        try {
            return fs.readdirSync(dirPath)
                .filter(item => {
                    const itemPath = path.join(dirPath, item);
                    return fs.statSync(itemPath).isDirectory();
                });
        } catch (error) {
            console.error(`读取子目录失败: ${dirPath}`, error.message);
            return [];
        }
    }
}

module.exports = FileManager;