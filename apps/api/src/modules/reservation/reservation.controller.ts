import { Body, Controller, Post } from "@nestjs/common";
import type {
  AcademicReservationRequest,
  AcademicReservationResponse
} from "@campusbook/shared-types";

import { CreateAcademicReservationDto } from "./dto/create-academic-reservation.dto";
import { ReservationService } from "./reservation.service";

@Controller("reservations")
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post("academic")
  createAcademicReservation(
    @Body() payload: CreateAcademicReservationDto
  ): Promise<AcademicReservationResponse> {
    return this.reservationService.createAcademicReservation(
      payload satisfies AcademicReservationRequest
    );
  }
}
