import { Body, Controller, Post } from "@nestjs/common";
import type {
  AcademicReservationRequest,
  AcademicReservationResponse,
  SportsReservationRequest,
  SportsReservationResponse
} from "@campusbook/shared-types";

import { CreateAcademicReservationDto } from "./dto/create-academic-reservation.dto";
import { CreateSportsReservationDto } from "./dto/create-sports-reservation.dto";
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

  @Post("sports")
  createSportsReservation(
    @Body() payload: CreateSportsReservationDto
  ): Promise<SportsReservationResponse> {
    return this.reservationService.createSportsReservation(
      payload satisfies SportsReservationRequest
    );
  }
}
