import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import type {
  AcademicReservationRequest,
  AcademicReservationResponse,
  SportsReservationRequest,
  SportsReservationResponse
} from "@campusbook/shared-types";

import { AccessTokenGuard } from "../auth/access-token.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";
import { CreateAcademicReservationDto } from "./dto/create-academic-reservation.dto";
import { CreateSportsReservationDto } from "./dto/create-sports-reservation.dto";
import { ReservationService } from "./reservation.service";

@Controller("reservations")
@UseGuards(AccessTokenGuard)
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post("academic")
  createAcademicReservation(
    @Body() payload: CreateAcademicReservationDto,
    @CurrentUser() currentUser: AuthenticatedUser
  ): Promise<AcademicReservationResponse> {
    return this.reservationService.createAcademicReservation(
      payload satisfies AcademicReservationRequest,
      currentUser
    );
  }

  @Post("sports")
  createSportsReservation(
    @Body() payload: CreateSportsReservationDto,
    @CurrentUser() currentUser: AuthenticatedUser
  ): Promise<SportsReservationResponse> {
    return this.reservationService.createSportsReservation(
      payload satisfies SportsReservationRequest,
      currentUser
    );
  }
}
