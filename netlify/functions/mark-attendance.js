import { GoogleSpreadsheet } from 'google-spreadsheet';
import { randomUUID } from 'crypto';

export default async (event, context) => {
  try {
    const doc = new GoogleSpreadsheet(process.env.SHEET_ID);

    // Use separate environment variables for Google Service Account
    const client_email = process.env.GOOGLE_CLIENT_EMAIL;
    const private_key = process.env.GOOGLE_PRIVATE_KEY;
    
    if (!client_email || !private_key) {
      throw new Error('Google Service Account credentials not found in environment variables');
    }

    await doc.useServiceAccountAuth({
      client_email: client_email,
      private_key: private_key.replace(/\\n/g, '\n'),
    });

    await doc.loadInfo();
    let sheet = doc.sheetsByTitle['Attendance'];
    if (!sheet) {
      sheet = await doc.addSheet({ title: 'Attendance', headerValues: ['id', 'memberId', 'memberName', 'gender', 'groupName', 'subgroupName', 'checkInTime', 'serviceDate', 'status'] });
    }

    const { memberId, memberName, gender, groupName, subgroupName, serviceDate, status } = JSON.parse(event.body);

    const newRow = await sheet.addRow({
      id: randomUUID(),
      memberId,
      memberName,
      gender,
      groupName,
      subgroupName,
      checkInTime: new Date().toISOString(),
      serviceDate,
      status,
    });

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

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ attendance: newAttendance }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
