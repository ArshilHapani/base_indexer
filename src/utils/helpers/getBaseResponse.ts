/**
 * This function may looks simple but it comes in handy when we want to send only base response to client.
 *
 * @param message The message that you want to send
 * @param success Status of the request
 * @returns Object containing `message` and `status`
 */
export default function getBaseResponse(message: string, success: boolean) {
  return {
    message,
    success,
  };
}
