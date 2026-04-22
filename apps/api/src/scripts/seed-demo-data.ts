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
      name: "陈思远",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      creditScore: 100
    },
    create: {
      id: "user_demo_student",
      email: "demo@campusbook.top",
      name: "陈思远",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      creditScore: 100
    }
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@campusbook.top" },
    update: {
      name: "梁老师",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      creditScore: 70
    },
    create: {
      id: "user_demo_admin",
      email: "admin@campusbook.top",
      name: "梁老师",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      creditScore: 70
    }
  });

  const partnerOneUser = await prisma.user.upsert({
    where: { email: "partner1@campusbook.top" },
    update: {
      name: "李可欣",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      creditScore: 100
    },
    create: {
      id: "user_demo_partner_one",
      email: "partner1@campusbook.top",
      name: "李可欣",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      creditScore: 100
    }
  });

  await prisma.user.upsert({
    where: { email: "partner2@campusbook.top" },
    update: {
      name: "王子衡",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      creditScore: 100
    },
    create: {
      id: "user_demo_partner_two",
      email: "partner2@campusbook.top",
      name: "王子衡",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      creditScore: 100
    }
  });

  await prisma.resource.upsert({
    where: { id: "res_academic_demo" },
    update: {
      type: ResourceType.ACADEMIC_SPACE,
      code: "E1-INNOVATION-01",
      name: "创新协作室",
      description: "位于 E1 Learning Commons 的开放式学术协作空间，适合课程讨论、项目评审与小组研讨。",
      location: "E1 Learning Commons 1F",
      status: ResourceStatus.ACTIVE
    },
    create: {
      id: "res_academic_demo",
      type: ResourceType.ACADEMIC_SPACE,
      code: "E1-INNOVATION-01",
      name: "创新协作室",
      description: "位于 E1 Learning Commons 的开放式学术协作空间，适合课程讨论、项目评审与小组研讨。",
      location: "E1 Learning Commons 1F",
      status: ResourceStatus.ACTIVE
    }
  });

  await prisma.resourceUnit.upsert({
    where: { id: "unit_academic_demo" },
    update: {
      resourceId: "res_academic_demo",
      code: "E1-INNOVATION-01-U1",
      name: "创新协作室 A",
      unitType: "room",
      availabilityMode: ResourceAvailabilityMode.CONTINUOUS,
      capacity: 8,
      sortOrder: 1
    },
    create: {
      id: "unit_academic_demo",
      resourceId: "res_academic_demo",
      code: "E1-INNOVATION-01-U1",
      name: "创新协作室 A",
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
      code: "SPORT-BADMINTON-A",
      name: "羽毛球馆 A 区",
      description: "支持单场预约与双场联动预约的羽毛球场地区域，适合日常训练和小型团体活动。",
      location: "Sports Hall A",
      status: ResourceStatus.ACTIVE
    },
    create: {
      id: "res_sports_demo",
      type: ResourceType.SPORTS_FACILITY,
      code: "SPORT-BADMINTON-A",
      name: "羽毛球馆 A 区",
      description: "支持单场预约与双场联动预约的羽毛球场地区域，适合日常训练和小型团体活动。",
      location: "Sports Hall A",
      status: ResourceStatus.ACTIVE
    }
  });

  await prisma.resourceUnit.upsert({
    where: { id: "unit_sports_demo_a" },
    update: {
      resourceId: "res_sports_demo",
      code: "SPORT-BADMINTON-A-A1",
      name: "A1 号场",
      unitType: "court",
      availabilityMode: ResourceAvailabilityMode.DISCRETE_SLOT,
      capacity: 4,
      sortOrder: 1
    },
    create: {
      id: "unit_sports_demo_a",
      resourceId: "res_sports_demo",
      code: "SPORT-BADMINTON-A-A1",
      name: "A1 号场",
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
      code: "SPORT-BADMINTON-A-A2",
      name: "A2 号场",
      unitType: "court",
      availabilityMode: ResourceAvailabilityMode.DISCRETE_SLOT,
      capacity: 4,
      sortOrder: 2
    },
    create: {
      id: "unit_sports_demo_b",
      resourceId: "res_sports_demo",
      code: "SPORT-BADMINTON-A-A2",
      name: "A2 号场",
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
      name: "双场联动场地",
      description: "用于双场联动训练或团体活动的组合场地。"
    },
    create: {
      id: "group_sports_demo_pair",
      resourceId: "res_sports_demo",
      name: "双场联动场地",
      description: "用于双场联动训练或团体活动的组合场地。"
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
      title: "校园开放日 2026",
      description: "面向新生、访客与合作伙伴的校园开放日活动，包含校园导览与学生项目展示。",
      location: "学术会堂",
      totalQuota: 220,
      saleStartTime,
      saleEndTime,
      eventStartTime,
      eventEndTime,
      status: ActivityStatus.PUBLISHED
    },
    create: {
      id: "activity_demo_open_day",
      title: "校园开放日 2026",
      description: "面向新生、访客与合作伙伴的校园开放日活动，包含校园导览与学生项目展示。",
      location: "学术会堂",
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
      name: "普通入场名额",
      stock: 180,
      priceCents: 0,
      status: ActivityTicketStatus.ACTIVE
    },
    create: {
      id: "ticket_demo_open_day_general",
      activityId: "activity_demo_open_day",
      name: "普通入场名额",
      stock: 180,
      priceCents: 0,
      status: ActivityTicketStatus.ACTIVE
    }
  });

  await prisma.activityTicket.upsert({
    where: { id: "ticket_demo_open_day_priority" },
    update: {
      activityId: "activity_demo_open_day",
      name: "优先通行名额",
      stock: 40,
      priceCents: 1500,
      status: ActivityTicketStatus.ACTIVE
    },
    create: {
      id: "ticket_demo_open_day_priority",
      activityId: "activity_demo_open_day",
      name: "优先通行名额",
      stock: 40,
      priceCents: 1500,
      status: ActivityTicketStatus.ACTIVE
    }
  });

  await prisma.activity.upsert({
    where: { id: "activity_demo_workshop_draft" },
    update: {
      title: "跨学科创新工作坊",
      description: "供教师端继续补充议程、导师与报名提醒的草稿活动。",
      location: "创新实验室",
      totalQuota: 30,
      saleStartTime,
      saleEndTime,
      eventStartTime: addDays(now, 28),
      eventEndTime: addHours(addDays(now, 28), 3),
      status: ActivityStatus.DRAFT
    },
    create: {
      id: "activity_demo_workshop_draft",
      title: "跨学科创新工作坊",
      description: "供教师端继续补充议程、导师与报名提醒的草稿活动。",
      location: "创新实验室",
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
      name: "工作坊席位",
      stock: 30,
      priceCents: 0,
      status: ActivityTicketStatus.ACTIVE
    },
    create: {
      id: "ticket_demo_workshop_standard",
      activityId: "activity_demo_workshop_draft",
      name: "工作坊席位",
      stock: 30,
      priceCents: 0,
      status: ActivityTicketStatus.ACTIVE
    }
  });

  await prisma.notification.upsert({
    where: { id: "notification_demo_sports_maintenance" },
    update: {
      title: "体育馆周三晚间维护提醒",
      summary: "羽毛球馆 A 区本周三 20:00 后暂停开放预约。",
      imageUrl:
        "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1200&q=80",
      content:
        "羽毛球馆 A 区将于本周三 20:00 后进行地板维护，相关时段的预约会陆续调整，请同学优先选择周四后的场次。",
      status: NotificationStatus.PUBLISHED,
      publishedAt: addHours(now, -4),
      createdByUserId: adminUser.id
    },
    create: {
      id: "notification_demo_sports_maintenance",
      title: "体育馆周三晚间维护提醒",
      summary: "羽毛球馆 A 区本周三 20:00 后暂停开放预约。",
      imageUrl:
        "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1200&q=80",
      content:
        "羽毛球馆 A 区将于本周三 20:00 后进行地板维护，相关时段的预约会陆续调整，请同学优先选择周四后的场次。",
      status: NotificationStatus.PUBLISHED,
      publishedAt: addHours(now, -4),
      createdByUserId: adminUser.id
    }
  });

  await prisma.notification.upsert({
    where: { id: "notification_demo_open_day" },
    update: {
      title: "开放日报名已开放",
      summary: "校园开放日 2026 已开放普通入场名额与优先通行名额报名。",
      imageUrl:
        "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1200&q=80",
      content:
        "开放日活动已经开放报名，学生可在活动页查看票种与余量。若需要与同行同学一同入场，请优先选择相同时段完成报名。",
      status: NotificationStatus.PUBLISHED,
      publishedAt: addHours(now, -1),
      createdByUserId: adminUser.id
    },
    create: {
      id: "notification_demo_open_day",
      title: "开放日报名已开放",
      summary: "校园开放日 2026 已开放普通入场名额与优先通行名额报名。",
      imageUrl:
        "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1200&q=80",
      content:
        "开放日活动已经开放报名，学生可在活动页查看票种与余量。若需要与同行同学一同入场，请优先选择相同时段完成报名。",
      status: NotificationStatus.PUBLISHED,
      publishedAt: addHours(now, -1),
      createdByUserId: adminUser.id
    }
  });

  await prisma.notification.upsert({
    where: { id: "notification_demo_draft_workshop" },
    update: {
      title: "跨学科创新工作坊预热通知",
      summary: "管理员可继续补充议程与报名提醒后发布。",
      imageUrl: null,
      content:
        "这是一条草稿通知，用于演示通知编辑、保存与发布流程。发布后应同步出现在学生首页通知区。",
      status: NotificationStatus.DRAFT,
      publishedAt: null,
      createdByUserId: adminUser.id
    },
    create: {
      id: "notification_demo_draft_workshop",
      title: "跨学科创新工作坊预热通知",
      summary: "管理员可继续补充议程与报名提醒后发布。",
      imageUrl: null,
      content:
        "这是一条草稿通知，用于演示通知编辑、保存与发布流程。发布后应同步出现在学生首页通知区。",
      status: NotificationStatus.DRAFT,
      publishedAt: null,
      createdByUserId: adminUser.id
    }
  });

  await prisma.serviceRequest.upsert({
    where: { id: "service_request_demo_screen" },
    update: {
      userId: studentUser.id,
      title: "创新协作室投影异常",
      description: "创新协作室 A 的投影设备显示无信号，已尝试更换线缆但未恢复。",
      location: "E1 Learning Commons 1F / 创新协作室 A",
      status: ServiceRequestStatus.RECEIVED,
      adminNote: "已登记给现场值班同事，预计今晚 19:00 前完成初步排查。",
      receivedAt: addHours(now, -2),
      resolvedAt: null
    },
    create: {
      id: "service_request_demo_screen",
      userId: studentUser.id,
      title: "创新协作室投影异常",
      description: "创新协作室 A 的投影设备显示无信号，已尝试更换线缆但未恢复。",
      location: "E1 Learning Commons 1F / 创新协作室 A",
      status: ServiceRequestStatus.RECEIVED,
      adminNote: "已登记给现场值班同事，预计今晚 19:00 前完成初步排查。",
      receivedAt: addHours(now, -2),
      resolvedAt: null
    }
  });

  await prisma.serviceRequest.upsert({
    where: { id: "service_request_demo_aircon" },
    update: {
      userId: partnerOneUser.id,
      title: "羽毛球馆空调温度异常",
      description: "羽毛球馆 A 区东侧场地空调未出风，体感温度明显偏高。",
      location: "Sports Hall A / 羽毛球馆 A 区东侧",
      status: ServiceRequestStatus.IN_PROGRESS,
      adminNote: "后勤已接单，等待设备检修人员到场。",
      receivedAt: addHours(now, -6),
      resolvedAt: null
    },
    create: {
      id: "service_request_demo_aircon",
      userId: partnerOneUser.id,
      title: "羽毛球馆空调温度异常",
      description: "羽毛球馆 A 区东侧场地空调未出风，体感温度明显偏高。",
      location: "Sports Hall A / 羽毛球馆 A 区东侧",
      status: ServiceRequestStatus.IN_PROGRESS,
      adminNote: "后勤已接单，等待设备检修人员到场。",
      receivedAt: addHours(now, -6),
      resolvedAt: null
    }
  });

  await prisma.rule.upsert({
    where: { id: "rule_demo_academic_min_credit" },
    update: {
      name: "学术空间最低信用分",
      ruleType: "min_credit_score",
      expression: { min: 80 },
      status: RuleStatus.ACTIVE
    },
    create: {
      id: "rule_demo_academic_min_credit",
      name: "学术空间最低信用分",
      ruleType: "min_credit_score",
      expression: { min: 80 },
      status: RuleStatus.ACTIVE
    }
  });

  await prisma.rule.upsert({
    where: { id: "rule_demo_academic_max_duration" },
    update: {
      name: "学术空间最长预约时长",
      ruleType: "max_duration_minutes",
      expression: { max: 120 },
      status: RuleStatus.ACTIVE
    },
    create: {
      id: "rule_demo_academic_max_duration",
      name: "学术空间最长预约时长",
      ruleType: "max_duration_minutes",
      expression: { max: 120 },
      status: RuleStatus.ACTIVE
    }
  });

  await prisma.rule.upsert({
    where: { id: "rule_demo_sports_student_only" },
    update: {
      name: "体育场馆预约角色限制",
      ruleType: "allowed_user_roles",
      expression: { roles: ["student"] },
      status: RuleStatus.ACTIVE
    },
    create: {
      id: "rule_demo_sports_student_only",
      name: "体育场馆预约角色限制",
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
