export const emailTemplates = {
  feeReminder: (data: { studentName: string; amount: number; dueDate: string; schoolName: string }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(to right, #3b82f6, #10b981); padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0;">${data.schoolName}</h1>
      </div>
      <div style="padding: 20px; background: #f8fafc;">
        <h2 style="color: #1e293b;">Fee Reminder</h2>
        <p>Dear Parent,</p>
        <p>This is a reminder that school fees of <strong>KES ${data.amount.toLocaleString()}</strong> for <strong>${data.studentName}</strong> are due by <strong>${data.dueDate}</strong>.</p>
        <p>Please make payment via M-Pesa Paybill or bank transfer.</p>
        <p style="margin-top: 20px;">Thank you,<br>${data.schoolName}</p>
      </div>
    </div>
  `,
  examResults: (data: { studentName: string; average: number; examName: string; schoolName: string }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(to right, #8b5cf6, #3b82f6); padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0;">${data.schoolName}</h1>
      </div>
      <div style="padding: 20px; background: #f8fafc;">
        <h2 style="color: #1e293b;">Exam Results</h2>
        <p>Dear Parent,</p>
        <p><strong>${data.studentName}</strong> scored <strong>${data.average}%</strong> in <strong>${data.examName}</strong>.</p>
        <p>Full report card available at the school.</p>
        <p style="margin-top: 20px;">Thank you,<br>${data.schoolName}</p>
      </div>
    </div>
  `,
  eventInvite: (data: { eventName: string; date: string; time: string; venue: string; schoolName: string }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(to right, #f59e0b, #ef4444); padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0;">${data.schoolName}</h1>
      </div>
      <div style="padding: 20px; background: #f8fafc;">
        <h2 style="color: #1e293b;">${data.eventName}</h2>
        <p>Dear Parent,</p>
        <p>You are invited to attend <strong>${data.eventName}</strong>.</p>
        <p><strong>Date:</strong> ${data.date}<br><strong>Time:</strong> ${data.time}<br><strong>Venue:</strong> ${data.venue}</p>
        <p>Please confirm attendance by replying to this email.</p>
        <p style="margin-top: 20px;">Thank you,<br>${data.schoolName}</p>
      </div>
    </div>
  `,
};
