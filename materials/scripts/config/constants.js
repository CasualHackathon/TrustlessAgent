/**
 * 配置常量
 * Configuration constants
 */

// 目录路径配置
const DIRECTORIES = {
    REGISTRATION: '../../../registration',
    SUBMISSION: '../../../submission',
    SCRIPTS: __dirname
};

// 文件名配置
const FILE_NAMES = {
    README: '../../README.md'
};

// 字段名配置
const FIELD_NAMES = {
    // 注册字段
    REGISTRATION: {
        NAME: 'Name',
        DESCRIPTION: 'Description',
        CONTACT: 'Contact',
        WALLET_ADDRESS: 'Wallet Address',
        TEAM_WILLINGNESS: 'Team Willingness'
    },
    // 项目提交字段
    SUBMISSION: {
        PROJECT_NAME: 'Project Name',
        PROJECT_DESCRIPTION: 'Project Description',
        PROJECT_MEMBERS: 'Project Members',
        PROJECT_LEADER: 'Project Leader',
        REPOSITORY_URL: 'Repository URL'
    }
};

// 必填字段配置
const REQUIRED_FIELDS = {
    REGISTRATION: [
        FIELD_NAMES.REGISTRATION.NAME,
        FIELD_NAMES.REGISTRATION.DESCRIPTION,
        FIELD_NAMES.REGISTRATION.CONTACT
    ],
    SUBMISSION: [
        FIELD_NAMES.SUBMISSION.PROJECT_NAME,
        FIELD_NAMES.SUBMISSION.PROJECT_DESCRIPTION,
        FIELD_NAMES.SUBMISSION.PROJECT_LEADER
    ]
};


// GitHub 相关配置
const GITHUB_CONFIG = {
    REPO_URL: 'https://github.com/CasualHackathon/Template', // TODO: 替换为实际仓库地址
    ISSUE_TITLE_PREFIXES: {
        REGISTRATION: 'Registration',
        SUBMISSION: 'Submission'
    }
};

// README 更新标记
const README_MARKERS = {
    REGISTRATION: {
        START: '<!-- Registration start -->',
        END: '<!-- Registration end -->'
    },
    SUBMISSION: {
        START: '<!-- Submission start -->',
        END: '<!-- Submission end -->'
    }
};


module.exports = {
    DIRECTORIES,
    FILE_NAMES,
    FIELD_NAMES,
    REQUIRED_FIELDS,
    GITHUB_CONFIG,
    README_MARKERS
};