import {
  ActivityStatus,
  ActivityTicketStatus,
  NotificationStatus,
  PrismaClient,
  ResourceAvailabilityMode,
  ResourceStatus,
  ResourceType,
  RuleStatus,
  ServiceRequestStatus,
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

  const studentUser = await prisma.user.upsert({
    where: { email: "demo@campusbook.top" },
    update: {
      name: "demo",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      creditScore: 100
    },
    create: {
      id: "user_demo_student",
      email: "demo@campusbook.top",
      name: "demo",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      creditScore: 100
    }
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@campusbook.top" },
    update: {
      name: "admin",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      creditScore: 70
    },
    create: {
      id: "user_demo_admin",
      email: "admin@campusbook.top",
      name: "admin",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      creditScore: 70
    }
  });

  const partnerOneUser = await prisma.user.upsert({
    where: { email: "partner1@campusbook.top" },
    update: {
      name: "partner1",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      creditScore: 100
    },
    create: {
      id: "user_demo_partner_one",
      email: "partner1@campusbook.top",
      name: "partner1",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      creditScore: 100
    }
  });

  await prisma.user.upsert({
    where: { email: "partner2@campusbook.top" },
    update: {
      name: "partner2",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      creditScore: 100
    },
    create: {
      id: "user_demo_partner_two",
      email: "partner2@campusbook.top",
      name: "partner2",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      creditScore: 100
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

  await prisma.notification.upsert({
    where: { id: "notification_demo_sports_maintenance" },
    update: {
      title: "体育馆周三晚间维护提醒",
      summary: "Sports Hall A 本周三 20:00 后暂停开放预约。",
      content:
        "Sports Hall A 将于本周三 20:00 后进行地板维护，相关时段的预约会陆续调整，请同学优先选择周四后的场次。",
      status: NotificationStatus.PUBLISHED,
      publishedAt: addHours(now, -4),
      createdByUserId: adminUser.id
    },
    create: {
      id: "notification_demo_sports_maintenance",
      title: "体育馆周三晚间维护提醒",
      summary: "Sports Hall A 本周三 20:00 后暂停开放预约。",
      content:
        "Sports Hall A 将于本周三 20:00 后进行地板维护，相关时段的预约会陆续调整，请同学优先选择周四后的场次。",
      status: NotificationStatus.PUBLISHED,
      publishedAt: addHours(now, -4),
      createdByUserId: adminUser.id
    }
  });

  await prisma.notification.upsert({
    where: { id: "notification_demo_open_day" },
    update: {
      title: "开放日报名已开放",
      summary: "Campus Open Day 2026 已开放普通票与优先票报名。",
      content:
        "开放日活动已经开放报名，学生可在活动页查看票种与余量。若需要带同学入场，请优先选择同一时段完成报名。",
      status: NotificationStatus.PUBLISHED,
      publishedAt: addHours(now, -1),
      createdByUserId: adminUser.id
    },
    create: {
      id: "notification_demo_open_day",
      title: "开放日报名已开放",
      summary: "Campus Open Day 2026 已开放普通票与优先票报名。",
      content:
        "开放日活动已经开放报名，学生可在活动页查看票种与余量。若需要带同学入场，请优先选择同一时段完成报名。",
      status: NotificationStatus.PUBLISHED,
      publishedAt: addHours(now, -1),
      createdByUserId: adminUser.id
    }
  });

  await prisma.notification.upsert({
    where: { id: "notification_demo_draft_workshop" },
    update: {
      title: "设计冲刺工作坊预热文案",
      summary: "管理员可在后台继续补充后发布。",
      content:
        "这是一条草稿通知，用于验证管理员编辑、保存与发布流程。发布后应同步出现在学生首页通知区。",
      status: NotificationStatus.DRAFT,
      publishedAt: null,
      createdByUserId: adminUser.id
    },
    create: {
      id: "notification_demo_draft_workshop",
      title: "设计冲刺工作坊预热文案",
      summary: "管理员可在后台继续补充后发布。",
      content:
        "这是一条草稿通知，用于验证管理员编辑、保存与发布流程。发布后应同步出现在学生首页通知区。",
      status: NotificationStatus.DRAFT,
      publishedAt: null,
      createdByUserId: adminUser.id
    }
  });

  await prisma.serviceRequest.upsert({
    where: { id: "service_request_demo_screen" },
    update: {
      userId: studentUser.id,
      title: "自习室投影无法连接",
      description: "Room 101 投影设备显示无信号，已尝试更换线缆但未恢复。",
      location: "Learning Commons 1F / Room 101",
      status: ServiceRequestStatus.RECEIVED,
      adminNote: "已登记给现场值班同事，今晚 19:00 前回看设备。",
      receivedAt: addHours(now, -2),
      resolvedAt: null
    },
    create: {
      id: "service_request_demo_screen",
      userId: studentUser.id,
      title: "自习室投影无法连接",
      description: "Room 101 投影设备显示无信号，已尝试更换线缆但未恢复。",
      location: "Learning Commons 1F / Room 101",
      status: ServiceRequestStatus.RECEIVED,
      adminNote: "已登记给现场值班同事，今晚 19:00 前回看设备。",
      receivedAt: addHours(now, -2),
      resolvedAt: null
    }
  });

  await prisma.serviceRequest.upsert({
    where: { id: "service_request_demo_aircon" },
    update: {
      userId: partnerOneUser.id,
      title: "羽毛球馆空调温度异常",
      description: "Sports Hall A 东侧区域空调未出风，体感温度明显偏高。",
      location: "Sports Hall A / East Courts",
      status: ServiceRequestStatus.IN_PROGRESS,
      adminNote: "后勤已接单，等待设备检修人员到场。",
      receivedAt: addHours(now, -6),
      resolvedAt: null
    },
    create: {
      id: "service_request_demo_aircon",
      userId: partnerOneUser.id,
      title: "羽毛球馆空调温度异常",
      description: "Sports Hall A 东侧区域空调未出风，体感温度明显偏高。",
      location: "Sports Hall A / East Courts",
      status: ServiceRequestStatus.IN_PROGRESS,
      adminNote: "后勤已接单，等待设备检修人员到场。",
      receivedAt: addHours(now, -6),
      resolvedAt: null
    }
  });

  await prisma.rule.upsert({
    where: { id: "rule_demo_academic_min_credit" },
    update: {
      name: "Academic Reservation Minimum Credit",
      ruleType: "min_credit_score",
      expression: { min: 80 },
      status: RuleStatus.ACTIVE
    },
    create: {
      id: "rule_demo_academic_min_credit",
      name: "Academic Reservation Minimum Credit",
      ruleType: "min_credit_score",
      expression: { min: 80 },
      status: RuleStatus.ACTIVE
    }
  });

  await prisma.rule.upsert({
    where: { id: "rule_demo_academic_max_duration" },
    update: {
      name: "Academic Reservation Maximum Duration",
      ruleType: "max_duration_minutes",
      expression: { max: 120 },
      status: RuleStatus.ACTIVE
    },
    create: {
      id: "rule_demo_academic_max_duration",
      name: "Academic Reservation Maximum Duration",
      ruleType: "max_duration_minutes",
      expression: { max: 120 },
      status: RuleStatus.ACTIVE
    }
  });

  await prisma.rule.upsert({
    where: { id: "rule_demo_sports_student_only" },
    update: {
      name: "Sports Reservation Student Only",
      ruleType: "allowed_user_roles",
      expression: { roles: ["student"] },
      status: RuleStatus.ACTIVE
    },
    create: {
      id: "rule_demo_sports_student_only",
      name: "Sports Reservation Student Only",
      ruleType: "allowed_user_roles",
      expression: { roles: ["student"] },
      status: RuleStatus.ACTIVE
    }
  });

  await prisma.resourceRuleBinding.upsert({
    where: {
      resourceId_ruleId: {
        resourceId: "res_academic_demo",
        ruleId: "rule_demo_academic_min_credit"
      }
    },
    update: {},
    create: {
      resourceId: "res_academic_demo",
      ruleId: "rule_demo_academic_min_credit"
    }
  });

  await prisma.resourceRuleBinding.upsert({
    where: {
      resourceId_ruleId: {
        resourceId: "res_academic_demo",
        ruleId: "rule_demo_academic_max_duration"
      }
    },
    update: {},
    create: {
      resourceId: "res_academic_demo",
      ruleId: "rule_demo_academic_max_duration"
    }
  });

  await prisma.resourceRuleBinding.upsert({
    where: {
      resourceId_ruleId: {
        resourceId: "res_sports_demo",
        ruleId: "rule_demo_sports_student_only"
      }
    },
    update: {},
    create: {
      resourceId: "res_sports_demo",
      ruleId: "rule_demo_sports_student_only"
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
        seededNotifications: [
          "notification_demo_sports_maintenance",
          "notification_demo_open_day",
          "notification_demo_draft_workshop"
        ],
        seededServiceRequests: [
          "service_request_demo_screen",
          "service_request_demo_aircon"
        ],
        seededUsers: [
          "demo@campusbook.top",
          "admin@campusbook.top",
          "partner1@campusbook.top",
          "partner2@campusbook.top"
        ],
        seededRules: [
          "rule_demo_academic_min_credit",
          "rule_demo_academic_max_duration",
          "rule_demo_sports_student_only"
        ]
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
