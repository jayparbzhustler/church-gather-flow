import { GoogleSpreadsheet } from 'google-spreadsheet';

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
      private_key: private_key,
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Attendance'];

    const today = new Date().toISOString().split('T')[0];
    const rows = await sheet.getRows({ limit: 1000 }); // Adjust limit as needed
    const todayAttendance = rows
      .filter(row => row.get('serviceDate') === today)
      .map(row => ({
        id: row.get('id'),
        memberId: row.get('memberId'),
        memberName: row.get('memberName'),
        gender: row.get('gender'),
        groupName: row.get('groupName'),
        subgroupName: row.get('subgroupName'),
        checkInTime: new Date(row.get('checkInTime')),
        serviceDate: row.get('serviceDate'),
        status: row.get('status'),
      }));

    return new Response(JSON.stringify({ attendance: todayAttendance }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
