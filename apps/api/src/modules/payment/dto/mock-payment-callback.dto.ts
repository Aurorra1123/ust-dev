import { IsNotEmpty, IsString } from "class-validator";

export class MockPaymentCallbackDto {
  @IsString()
  @IsNotEmpty()
  transactionNo!: string;
}
