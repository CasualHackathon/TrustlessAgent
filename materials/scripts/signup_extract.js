/**
 * Registration information extraction script
 * 
 * Used to process registration information from GitHub Issues, create user registration files and update README table
 */

const RegistrationProcessor = require('./processors/registration-processor');

// Get parameters from environment variables
const issueBody = process.env.ISSUE_BODY;

const githubUser = process.env.ISSUE_USER;

// Debug output
console.log('Processing user:', githubUser);
console.log('Issue content:\n', issueBody);

try {
    // Process registration
    RegistrationProcessor.processRegistration(issueBody, githubUser);
    console.log('✅ Registration processing completed successfully');
} catch (error) {
    console.error('ERROR_MESSAGE:', `❌ **Processing Failed**\n\nRegistration processing failed: ${error.message}`);
    console.error('Registration processing failed:', error.message);
    process.exit(1);
}