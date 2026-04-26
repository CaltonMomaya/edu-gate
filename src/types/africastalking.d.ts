declare module 'africastalking' {
  interface SMSOptions {
    to: string[];
    message: string;
    from?: string;
  }

  interface SMSResult {
    SMSMessageData?: {
      Recipients?: Array<{
        messageId: string;
        status: string;
      }>;
    };
  }

  interface AfricasTalkingInstance {
    SMS: {
      send: (options: SMSOptions) => Promise<SMSResult>;
    };
  }

  function AfricasTalking(config: { apiKey: string; username: string }): AfricasTalkingInstance;
  export default AfricasTalking;
}
