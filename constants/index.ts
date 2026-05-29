export const navigationLinks = [
  {
    href: "/library",
    label: "图书馆",
  },

  {
    img: "/icons/user.svg",
    selectedImg: "/icons/user-fill.svg",
    href: "/my-profile",
    label: "个人中心",
  },
];

export const adminSideBarLinks = [
  {
    img: "/icons/admin/home.svg",
    route: "/admin",
    text: "首页",
  },
  {
    img: "/icons/admin/users.svg",
    route: "/admin/users",
    text: "全部用户",
  },
  {
    img: "/icons/admin/book.svg",
    route: "/admin/books",
    text: "全部图书",
  },
  {
    img: "/icons/admin/bookmark.svg",
    route: "/admin/book-requests",
    text: "借阅申请",
  },
  {
    img: "/icons/admin/user.svg",
    route: "/admin/account-requests",
    text: "账号申请",
  },
  {
    img: "/icons/admin/home.svg",
    route: "/admin/risk-dashboard",
    text: "风险仪表盘",
  },
];

export const FIELD_NAMES = {
  fullName: "姓名",
  email: "邮箱",
  universityId: "学号",
  password: "密码",
  universityCard: "上传校园卡",
};

export const FIELD_TYPES = {
  fullName: "text",
  email: "email",
  universityId: "number",
  password: "password",
};

export const sampleBooks = [
  {
    id: 1,
    title: "The Midnight Library",
    author: "Matt Haig",
    genre: "奇幻 / 小说",
    rating: 4.6,
    total_copies: 20,
    available_copies: 10,
    description:
      "一部关于人生选择与可能性的璀璨小说。《午夜图书馆》讲述了诺拉·希德在生死之间发现自我，探索每一种可能人生的奇妙旅程。",
    color: "#1c1f40",
    cover: "https://m.media-amazon.com/images/I/81J6APjwxlL.jpg",
    video: "/sample-video.mp4?updatedAt=1722593504152",
    summary:
      "一部关于人生选择与可能性的璀璨小说。《午夜图书馆》讲述了诺拉·希德在生死之间发现自我，探索每一种可能人生的奇妙旅程。",
  },
  {
    id: 2,
    title: "Atomic Habits",
    author: "James Clear",
    genre: "自我提升 / 效率",
    rating: 4.9,
    total_copies: 99,
    available_copies: 50,
    description:
      "一本关于养成好习惯、戒除坏习惯的革命性指南，助你每天进步 1%。",
    color: "#fffdf6",
    cover: "https://m.media-amazon.com/images/I/81F90H7hnML.jpg",
    video: "/sample-video.mp4?updatedAt=1722593504152",
    summary:
      "一本关于养成好习惯、戒除坏习惯的革命性指南，助你每天进步 1%。",
  },
  {
    id: 3,
    title: "You Don't Know JS: Scope & Closures",
    author: "Kyle Simpson",
    genre: "计算机科学 / JavaScript",
    rating: 4.7,
    total_copies: 9,
    available_copies: 5,
    description:
      "一本理解 JavaScript 核心机制的必备指南，聚焦于作用域与闭包。",
    color: "#f8e036",
    cover:
      "https://m.media-amazon.com/images/I/7186YfjgHHL._AC_UF1000,1000_QL80_.jpg",
    video: "/sample-video.mp4?updatedAt=1722593504152",
    summary:
      "一本理解 JavaScript 核心机制的必备指南，聚焦于作用域与闭包。",
  },
  {
    id: 4,
    title: "The Alchemist",
    author: "Paulo Coelho",
    genre: "哲学 / 冒险",
    rating: 4.5,
    total_copies: 78,
    available_copies: 50,
    description:
      "一个关于安达卢西亚牧羊少年圣地亚哥踏上寻宝之旅的奇幻故事。",
    color: "#ed6322",
    cover:
      "https://m.media-amazon.com/images/I/61HAE8zahLL._AC_UF1000,1000_QL80_.jpg",
    video: "/sample-video.mp4?updatedAt=1722593504152",
    summary:
      "一个关于安达卢西亚牧羊少年圣地亚哥踏上寻宝之旅的奇幻故事。",
  },
  {
    id: 5,
    title: "Deep Work",
    author: "Cal Newport",
    genre: "自我提升 / 效率",
    rating: 4.7,
    total_copies: 23,
    available_copies: 23,
    description:
      "在这个充满干扰的世界中，教你如何培养深度专注力，实现巅峰效率。",
    color: "#ffffff",
    cover: "https://m.media-amazon.com/images/I/81JJ7fyyKyS.jpg",
    video: "/sample-video.mp4?updatedAt=1722593504152",
    summary:
      "在这个充满干扰的世界中，教你如何培养深度专注力，实现巅峰效率。",
  },
  {
    id: 6,
    title: "Clean Code",
    author: "Robert C. Martin",
    genre: "计算机科学 / 编程",
    rating: 4.8,
    total_copies: 56,
    available_copies: 56,
    description:
      "一本关于敏捷软件工艺的经典手册，提供编写整洁、可维护代码的最佳实践与原则。",
    color: "#080c0d",
    cover:
      "https://m.media-amazon.com/images/I/71T7aD3EOTL._UF1000,1000_QL80_.jpg",
    video: "/sample-video.mp4?updatedAt=1722593504152",
    summary:
      "一本关于敏捷软件工艺的经典手册，提供编写整洁、可维护代码的最佳实践与原则。",
  },
  {
    id: 7,
    title: "The Pragmatic Programmer",
    author: "Andrew Hunt, David Thomas",
    genre: "计算机科学 / 编程",
    rating: 4.8,
    total_copies: 25,
    available_copies: 3,
    description:
      "一本面向开发者的永恒指南，帮助打磨技能、改进编程实践。",
    color: "#100f15",
    cover:
      "https://m.media-amazon.com/images/I/71VStSjZmpL._AC_UF1000,1000_QL80_.jpg",
    video: "/sample-video.mp4?updatedAt=1722593504152",
    summary:
      "一本面向开发者的永恒指南，帮助打磨技能、改进编程实践。",
  },
  {
    id: 8,
    title: "The Psychology of Money",
    author: "Morgan Housel",
    genre: "金融 / 自我提升",
    rating: 4.8,
    total_copies: 10,
    available_copies: 5,
    description:
      "摩根·豪泽尔探讨了塑造财务成功与决策的独特行为与思维方式。",
    color: "#ffffff",
    cover:
      "https://m.media-amazon.com/images/I/81Dky+tD+pL._AC_UF1000,1000_QL80_.jpg",
    video: "/sample-video.mp4?updatedAt=1722593504152",
    summary:
      "摩根·豪泽尔探讨了塑造财务成功与决策的独特行为与思维方式。",
  },
];
