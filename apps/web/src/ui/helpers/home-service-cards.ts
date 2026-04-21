export type HomeServiceCardId =
  | "sports"
  | "study"
  | "activities"
  | "service_requests";

export type HomeServiceCard = {
  id: HomeServiceCardId;
  href: string;
  titleZh: string;
  titleEn: string;
  descriptionZh: string;
  descriptionEn: string;
};

export const homeServiceCards: HomeServiceCard[] = [
  {
    id: "sports",
    href: "/sports",
    titleZh: "体育",
    titleEn: "Sports",
    descriptionZh: "进入体育场馆预约页面，查看时段并提交预约。",
    descriptionEn: "Open the sports booking page."
  },
  {
    id: "study",
    href: "/spaces",
    titleZh: "学术",
    titleEn: "Study",
    descriptionZh: "进入学术空间预约页面，选择资源与时间。",
    descriptionEn: "Open the study-space booking page."
  },
  {
    id: "activities",
    href: "/activities",
    titleZh: "活动",
    titleEn: "Activities",
    descriptionZh: "进入活动页面，查看活动并完成报名。",
    descriptionEn: "Open the activity registration page."
  },
  {
    id: "service_requests",
    href: "/service-requests",
    titleZh: "报修",
    titleEn: "Repairs",
    descriptionZh: "提交事故或设备报修，并跟踪管理员处理状态。",
    descriptionEn: "Submit a repair ticket and track the admin response."
  }
];
