/**
 * 通用字段解析工具
 * Common field parsing utilities for issue body and file content
 */

/**
 * 解析 Issue Body 中的字段
 * @param {string} bodyString - Issue body 内容
 * @returns {Object} 解析后的字段对象
 */
function parseIssueFields(bodyString) {
    const cleanBody = bodyString
        .split('\n')
        .map(line => line.trim())
        .join('\n');

    const lines = cleanBody.split('\n');
    const fields = {};

    for (const line of lines) {
        // 支持新的英文格式 **Field Name:** 和旧的中文格式 Field[中文]:
        if (line.startsWith('**') && line.includes(':**')) {
            // 新格式: **Field Name:**
            const match = line.match(/^\*\*(.+?):\*\*$/);
            if (match) {
                const key = match[1].trim();
                // 查找下一个非空行作为值
                const currentIndex = lines.indexOf(line);
                let value = '';
                for (let i = currentIndex + 1; i < lines.length; i++) {
                    const nextLine = lines[i].trim();
                    if (nextLine && !nextLine.startsWith('**') && !nextLine.startsWith('*')) {
                        value = nextLine;
                        break;
                    }
                }
                fields[key] = value;
            }
        } else {
            // 旧格式: Field[中文]: 或 Field:
            const colonIndex = line.indexOf(':') !== -1 ? line.indexOf(':') : line.indexOf('：');
            if (colonIndex !== -1) {
                const key = line.slice(0, colonIndex).trim();
                const value = line.slice(colonIndex + 1).trim();
                fields[key] = value;
            }
        }
    }

    return fields;
}

/**
 * 从文件内容中解析指定字段
 * @param {string} content - 文件内容
 * @param {string} fieldName - 字段名称
 * @returns {string} 字段值
 */
function parseFieldFromContent(content, fieldName) {
    const lines = content.split('\n');
    const pattern = `**${fieldName}**:`;

    for (const line of lines) {
        if (line.startsWith(pattern)) {
            return line.slice(pattern.length).replace(/\s+$/, '').trim();
        }
    }

    return '';
}

module.exports = {
    parseIssueFields,
    parseFieldFromContent
};