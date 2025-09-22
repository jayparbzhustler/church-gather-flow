const { GoogleSpreadsheet } = require('google-spreadsheet');
const crypto = require('crypto');

module.exports = async (event, context) => {
  try {
    // Check if required environment variables are set
    console.log('Checking environment variables...');
    if (!process.env.SHEET_ID) {
      console.error('SHEET_ID environment variable is missing');
      throw new Error('SHEET_ID environment variable is required');
    }
    if (!process.env.GOOGLE_CLIENT_EMAIL) {
      console.error('GOOGLE_CLIENT_EMAIL environment variable is missing');
      throw new Error('GOOGLE_CLIENT_EMAIL environment variable is required');
    }
    if (!process.env.GOOGLE_PRIVATE_KEY) {
      console.error('GOOGLE_PRIVATE_KEY environment variable is missing');
      throw new Error('GOOGLE_PRIVATE_KEY environment variable is required');
    }

    console.log('Environment variables found, initializing Google Sheets...');
    const doc = new GoogleSpreadsheet(process.env.SHEET_ID);

    console.log('Authenticating with Google Sheets...');
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });

    console.log('Loading document info...');
    await doc.loadInfo();
    console.log(`Document title: ${doc.title}`);
    
    // Check if Attendance sheet exists, create it if not
    let sheet = doc.sheetsByTitle['Attendance'];
    if (!sheet) {
      console.log('Attendance sheet not found, creating it...');
      sheet = await doc.addSheet({ title: 'Attendance', headerValues: ['id', 'memberId', 'memberName', 'gender', 'groupName', 'subgroupName', 'checkInTime', 'serviceDate', 'status'] });
      console.log('Attendance sheet created');
    } else {
      console.log('Attendance sheet found');
    }

    console.log('Parsing request body...');
    const { memberId, memberName, gender, groupName, subgroupName, serviceDate, status } = JSON.parse(event.body);
    console.log('Request body parsed:', { memberId, memberName, gender, groupName, subgroupName, serviceDate, status });

    console.log('Adding row to Google Sheets...');
    const newRow = await sheet.addRow({
      id: crypto.randomUUID(),
      memberId,
      memberName,
      gender,
      groupName,
      subgroupName,
      checkInTime: new Date().toISOString(),
      serviceDate,
      status,
    });
    console.log('Row added successfully');

    const newAttendance = {
      id: newRow.get('id'),
      memberId: newRow.get('memberId'),
      memberName: newRow.get('memberName'),
      gender: newRow.get('gender'),
      groupName: newRow.get('groupName'),
      subgroupName: newRow.get('subgroupName'),
      checkInTime: new Date(newRow.get('checkInTime')),
      serviceDate: newRow.get('serviceDate'),
      status: newRow.get('status'),
    };
    console.log('Attendance record created:', newAttendance);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ attendance: newAttendance }),
    };
  } catch (error) {
    console.error('Error in mark-attendance function:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: error.message,
        details: 'Check Netlify function logs for more information. Ensure Google Sheets API is enabled and environment variables are set correctly.'
      }),
    };
  }
};
