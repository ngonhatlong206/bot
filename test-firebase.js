#!/usr/bin/env node

const { saveCookie, loadCookie, checkCookieStatus, getAllCookies } = require('./lib/firebaseManager');
const cookieMonitor = require('./utils/cookieMonitor');
const logger = require('./utils/log');
const chalk = require('chalk');

console.log(chalk.blue('🧪 Testing Firebase Integration...\n'));

async function testFirebase() {
    try {
        // Test 1: Kiểm tra kết nối Firebase
        console.log(chalk.yellow('1. Testing Firebase Connection...'));
        const status = await checkCookieStatus('ngonhatlongffff@gmail.com');
        console.log(chalk.green('✅ Firebase connection successful'));
        console.log('Status:', status);

        // Test 2: Test lưu cookie
        console.log(chalk.yellow('\n2. Testing Cookie Save...'));
        const testCookie = [
            {
                key: 'test_key',
                value: 'test_value',
                domain: '.facebook.com',
                path: '/',
                secure: true,
                httpOnly: true
            }
        ];
        
        const saveResult = await saveCookie(testCookie, 'test@example.com');
        if (saveResult) {
            console.log(chalk.green('✅ Cookie save successful'));
        } else {
            console.log(chalk.red('❌ Cookie save failed'));
        }

        // Test 3: Test tải cookie
        console.log(chalk.yellow('\n3. Testing Cookie Load...'));
        const loadedCookie = await loadCookie('test@example.com');
        if (loadedCookie) {
            console.log(chalk.green('✅ Cookie load successful'));
            console.log('Loaded cookie:', loadedCookie);
        } else {
            console.log(chalk.red('❌ Cookie load failed'));
        }

        // Test 4: Test lấy danh sách cookie
        console.log(chalk.yellow('\n4. Testing Get All Cookies...'));
        const allCookies = await getAllCookies();
        console.log(chalk.green('✅ Get all cookies successful'));
        console.log('Total cookies:', allCookies.length);
        allCookies.forEach(cookie => {
            console.log(`- ${cookie.email}: ${cookie.status}`);
        });

        // Test 5: Test Cookie Monitor
        console.log(chalk.yellow('\n5. Testing Cookie Monitor...'));
        const monitorStatus = cookieMonitor.getStatus();
        console.log(chalk.green('✅ Cookie monitor status:'));
        console.log('Monitoring:', monitorStatus.isMonitoring);
        console.log('Email:', monitorStatus.email);
        console.log('Check interval:', monitorStatus.checkInterval / 60000, 'minutes');

        console.log(chalk.green('\n🎉 All tests completed successfully!'));

    } catch (error) {
        console.log(chalk.red('\n❌ Test failed:'));
        console.log(error.message);
        console.log(chalk.yellow('\nTroubleshooting:'));
        console.log('1. Check your .env file configuration');
        console.log('2. Verify Firebase project settings');
        console.log('3. Check network connection');
        console.log('4. Ensure all dependencies are installed');
    }
}

// Chạy test
testFirebase().then(() => {
    console.log(chalk.blue('\n🏁 Test completed. Exiting...'));
    process.exit(0);
}).catch((error) => {
    console.log(chalk.red('\n💥 Test crashed:'));
    console.log(error);
    process.exit(1);
}); 