import {
  ActivityStatus,
  ActivityTicketStatus,
  PrismaClient,
  ResourceAvailabilityMode,
  ResourceStatus,
  ResourceType,
  UserRole,
  UserStatus
} from "@prisma/client";

process.env.DATABASE_URL ??=
  "postgresql://campusbook:campusbook@127.0.0.1:5432/campusbook?schema=public";

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const saleStartTime = addDays(now, -1);
  const saleEndTime = addDays(now, 14);
  const eventStartTime = addDays(now, 21);
  const eventEndTime = addHours(eventStartTime, 2);

  await prisma.user.upsert({
    where: { email: "demo@campusbook.top" },
    update: {
      name: "demo",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE
    },
    create: {
      id: "user_demo_student",
      email: "demo@campusbook.top",
      name: "demo",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE
    }
  });

  await prisma.user.upsert({
    where: { email: "admin@campusbook.top" },
    update: {
      name: "admin",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE
    },
    create: {
      id: "user_demo_admin",
      email: "admin@campusbook.top",
      name: "admin",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE
    }
  });

  await prisma.resource.upsert({
    where: { id: "res_academic_demo" },
    update: {
      type: ResourceType.ACADEMIC_SPACE,
      code: "ACAD-ROOM-101",
      name: "Room 101",
      description: "演示用学术空间，适合小组讨论与项目评审。",
      location: "Learning Commons 1F",
      status: ResourceStatus.ACTIVE
    },
    create: {
      id: "res_academic_demo",
      type: ResourceType.ACADEMIC_SPACE,
      code: "ACAD-ROOM-101",
      name: "Room 101",
      description: "演示用学术空间，适合小组讨论与项目评审。",
      location: "Learning Commons 1F",
      status: ResourceStatus.ACTIVE
    }
  });

  await prisma.resourceUnit.upsert({
    where: { id: "unit_academic_demo" },
    update: {
      resourceId: "res_academic_demo",
      code: "ACAD-ROOM-101-U1",
      name: "Room 101",
      unitType: "room",
      availabilityMode: ResourceAvailabilityMode.CONTINUOUS,
      capacity: 8,
      sortOrder: 1
    },
    create: {
      id: "unit_academic_demo",
      resourceId: "res_academic_demo",
      code: "ACAD-ROOM-101-U1",
      name: "Room 101",
      unitType: "room",
      availabilityMode: ResourceAvailabilityMode.CONTINUOUS,
      capacity: 8,
      sortOrder: 1
    }
  });

  await prisma.resource.upsert({
    where: { id: "res_sports_demo" },
    update: {
      type: ResourceType.SPORTS_FACILITY,
      code: "SPORTS-DEMO",
      name: "Badminton Demo Courts",
      description: "演示用羽毛球双场地资源，支持单场与组合预约。",
      location: "Sports Hall A",
      status: ResourceStatus.ACTIVE
    },
    create: {
      id: "res_sports_demo",
      type: ResourceType.SPORTS_FACILITY,
      code: "SPORTS-DEMO",
      name: "Badminton Demo Courts",
      description: "演示用羽毛球双场地资源，支持单场与组合预约。",
      location: "Sports Hall A",
      status: ResourceStatus.ACTIVE
    }
  });

  await prisma.resourceUnit.upsert({
    where: { id: "unit_sports_demo_a" },
    update: {
      resourceId: "res_sports_demo",
      code: "SPORTS-DEMO-A",
      name: "Court A",
      unitType: "court",
      availabilityMode: ResourceAvailabilityMode.DISCRETE_SLOT,
      capacity: 4,
      sortOrder: 1
    },
    create: {
      id: "unit_sports_demo_a",
      resourceId: "res_sports_demo",
      code: "SPORTS-DEMO-A",
      name: "Court A",
      unitType: "court",
      availabilityMode: ResourceAvailabilityMode.DISCRETE_SLOT,
      capacity: 4,
      sortOrder: 1
    }
  });

  await prisma.resourceUnit.upsert({
    where: { id: "unit_sports_demo_b" },
    update: {
      resourceId: "res_sports_demo",
      code: "SPORTS-DEMO-B",
      name: "Court B",
      unitType: "court",
      availabilityMode: ResourceAvailabilityMode.DISCRETE_SLOT,
      capacity: 4,
      sortOrder: 2
    },
    create: {
      id: "unit_sports_demo_b",
      resourceId: "res_sports_demo",
      code: "SPORTS-DEMO-B",
      name: "Court B",
      unitType: "court",
      availabilityMode: ResourceAvailabilityMode.DISCRETE_SLOT,
      capacity: 4,
      sortOrder: 2
    }
  });

  await prisma.resourceGroup.upsert({
    where: { id: "group_sports_demo_pair" },
    update: {
      resourceId: "res_sports_demo",
      name: "Badminton Pair",
      description: "双场地联动预约演示组合。"
    },
    create: {
      id: "group_sports_demo_pair",
      resourceId: "res_sports_demo",
      name: "Badminton Pair",
      description: "双场地联动预约演示组合。"
    }
  });

  await prisma.resourceGroupItem.upsert({
    where: { id: "group_item_sports_demo_a" },
    update: {
      groupId: "group_sports_demo_pair",
      resourceUnitId: "unit_sports_demo_a",
      sortOrder: 1
    },
    create: {
      id: "group_item_sports_demo_a",
      groupId: "group_sports_demo_pair",
      resourceUnitId: "unit_sports_demo_a",
      sortOrder: 1
    }
  });

  await prisma.resourceGroupItem.upsert({
    where: { id: "group_item_sports_demo_b" },
    update: {
      groupId: "group_sports_demo_pair",
      resourceUnitId: "unit_sports_demo_b",
      sortOrder: 2
    },
    create: {
      id: "group_item_sports_demo_b",
      groupId: "group_sports_demo_pair",
      resourceUnitId: "unit_sports_demo_b",
      sortOrder: 2
    }
  });

  await prisma.activity.upsert({
    where: { id: "activity_demo_open_day" },
    update: {
      title: "Campus Open Day 2026",
      description: "面向新生与访客的校园开放日活动。",
      location: "Main Auditorium",
      totalQuota: 220,
      saleStartTime,
      saleEndTime,
      eventStartTime,
      eventEndTime,
      status: ActivityStatus.PUBLISHED
    },
    create: {
      id: "activity_demo_open_day",
      title: "Campus Open Day 2026",
      description: "面向新生与访客的校园开放日活动。",
      location: "Main Auditorium",
      totalQuota: 220,
      saleStartTime,
      saleEndTime,
      eventStartTime,
      eventEndTime,
      status: ActivityStatus.PUBLISHED
    }
  });

  await prisma.activityTicket.upsert({
    where: { id: "ticket_demo_open_day_general" },
    update: {
      activityId: "activity_demo_open_day",
      name: "General Admission",
      stock: 180,
      priceCents: 0,
      status: ActivityTicketStatus.ACTIVE
    },
    create: {
      id: "ticket_demo_open_day_general",
      activityId: "activity_demo_open_day",
      name: "General Admission",
      stock: 180,
      priceCents: 0,
      status: ActivityTicketStatus.ACTIVE
    }
  });

  await prisma.activityTicket.upsert({
    where: { id: "ticket_demo_open_day_priority" },
    update: {
      activityId: "activity_demo_open_day",
      name: "Priority Pass",
      stock: 40,
      priceCents: 1500,
      status: ActivityTicketStatus.ACTIVE
    },
    create: {
      id: "ticket_demo_open_day_priority",
      activityId: "activity_demo_open_day",
      name: "Priority Pass",
      stock: 40,
      priceCents: 1500,
      status: ActivityTicketStatus.ACTIVE
    }
  });

  await prisma.activity.upsert({
    where: { id: "activity_demo_workshop_draft" },
    update: {
      title: "Design Sprint Workshop",
      description: "演示用草稿活动，供管理员维护接口验证。",
      location: "Innovation Lab",
      totalQuota: 30,
      saleStartTime,
      saleEndTime,
      eventStartTime: addDays(now, 28),
      eventEndTime: addHours(addDays(now, 28), 3),
      status: ActivityStatus.DRAFT
    },
    create: {
      id: "activity_demo_workshop_draft",
      title: "Design Sprint Workshop",
      description: "演示用草稿活动，供管理员维护接口验证。",
      location: "Innovation Lab",
      totalQuota: 30,
      saleStartTime,
      saleEndTime,
      eventStartTime: addDays(now, 28),
      eventEndTime: addHours(addDays(now, 28), 3),
      status: ActivityStatus.DRAFT
    }
  });

  await prisma.activityTicket.upsert({
    where: { id: "ticket_demo_workshop_standard" },
    update: {
      activityId: "activity_demo_workshop_draft",
      name: "Workshop Seat",
      stock: 30,
      priceCents: 0,
      status: ActivityTicketStatus.ACTIVE
    },
    create: {
      id: "ticket_demo_workshop_standard",
      activityId: "activity_demo_workshop_draft",
      name: "Workshop Seat",
      stock: 30,
      priceCents: 0,
      status: ActivityTicketStatus.ACTIVE
    }
  });

  console.log(
    JSON.stringify(
      {
        seededResources: [
          "res_academic_demo",
          "res_sports_demo",
          "group_sports_demo_pair"
        ],
        seededActivities: [
          "activity_demo_open_day",
          "activity_demo_workshop_draft"
        ],
        seededUsers: ["demo@campusbook.top", "admin@campusbook.top"]
      },
      null,
      2
    )
  );
}

function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000);
}

function addHours(value: Date, hours: number) {
  return new Date(value.getTime() + hours * 60 * 60 * 1000);
}

main()
  .catch((error: unknown) => {
    console.error("failed-to-seed-demo-data", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
