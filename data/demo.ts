export interface Worker {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  experience: number;
  rating: number;
  reviews: number;
  location: string;
  hourlyRate: number;
  available: boolean;
  skills: string[];
  completedJobs: number;
  bio: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  salary: string;
  type: string;
  posted: string;
  deadline: string;
  description: string;
  requirements: string[];
  benefits: string[];
  applicants: number;
}

export interface ChatRoom {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

export interface Message {
  id: string;
  roomId: string;
  sender: "me" | "other";
  text: string;
  time: string;
}

export interface Review {
  id: string;
  workerName: string;
  workerAvatar: string;
  companyName: string;
  rating: number;
  categories: { label: string; score: number }[];
  comment: string;
  date: string;
}

export const workers: Worker[] = [
  {
    id: "w1",
    name: "김철수",
    avatar: "👷",
    specialty: "배관공",
    experience: 15,
    rating: 4.8,
    reviews: 127,
    location: "서울 강남구",
    hourlyRate: 45000,
    available: true,
    skills: ["수도배관", "난방배관", "가스배관", "누수수리"],
    completedJobs: 342,
    bio: "15년 경력의 배관 전문가입니다. 주거/상업 시설 모두 가능합니다.",
  },
  {
    id: "w2",
    name: "이영희",
    avatar: "👷‍♀️",
    specialty: "전기기사",
    experience: 10,
    rating: 4.9,
    reviews: 89,
    location: "서울 서초구",
    hourlyRate: 50000,
    available: true,
    skills: ["내선공사", "조명설치", "분전반", "접지공사"],
    completedJobs: 256,
    bio: "전기기사 1급 자격증 보유. 안전한 전기공사를 약속합니다.",
  },
  {
    id: "w3",
    name: "박민호",
    avatar: "👷",
    specialty: "인테리어",
    experience: 8,
    rating: 4.7,
    reviews: 64,
    location: "경기 성남시",
    hourlyRate: 40000,
    available: false,
    skills: ["도배", "타일", "바닥재", "목공"],
    completedJobs: 189,
    bio: "감각적인 인테리어 시공을 합리적 가격에 제공합니다.",
  },
  {
    id: "w4",
    name: "최승현",
    avatar: "👷",
    specialty: "철근공",
    experience: 20,
    rating: 4.6,
    reviews: 156,
    location: "인천 남동구",
    hourlyRate: 55000,
    available: true,
    skills: ["철근배근", "용접", "구조물", "콘크리트"],
    completedJobs: 478,
    bio: "20년 베테랑 철근 전문가. 대형 건축 프로젝트 다수 경험.",
  },
  {
    id: "w5",
    name: "정수민",
    avatar: "👷‍♀️",
    specialty: "도장공",
    experience: 6,
    rating: 4.5,
    reviews: 42,
    location: "서울 마포구",
    hourlyRate: 35000,
    available: true,
    skills: ["내부도장", "외부도장", "방수", "에폭시"],
    completedJobs: 134,
    bio: "깔끔한 마감을 자신합니다. 친환경 페인트 전문.",
  },
  {
    id: "w6",
    name: "한지우",
    avatar: "👷",
    specialty: "목수",
    experience: 12,
    rating: 4.8,
    reviews: 98,
    location: "서울 송파구",
    hourlyRate: 48000,
    available: true,
    skills: ["가구제작", "수장공사", "몰딩", "데크"],
    completedJobs: 312,
    bio: "정교한 목공 작업이 전문입니다. 맞춤 가구 제작 가능.",
  },
];

export const jobs: Job[] = [
  {
    id: "j1",
    title: "강남 오피스텔 배관 교체 공사",
    company: "한양건설",
    companyLogo: "🏗️",
    location: "서울 강남구",
    salary: "일 35만원",
    type: "단기 (2주)",
    posted: "2026-03-01",
    deadline: "2026-03-15",
    description:
      "강남구 소재 오피스텔 30세대 배관 교체 작업입니다. 노후 배관을 신규 PVC 배관으로 교체하는 프로젝트로, 경험 있는 배관공을 모집합니다.",
    requirements: [
      "배관공 경력 5년 이상",
      "PVC 배관 시공 경험",
      "자격증 소지자 우대",
    ],
    benefits: ["중식 제공", "주차 가능", "안전장비 지급"],
    applicants: 12,
  },
  {
    id: "j2",
    title: "판교 IT빌딩 전기 설비 점검",
    company: "테크파크건설",
    companyLogo: "🏢",
    location: "경기 성남시",
    salary: "일 40만원",
    type: "정기 (월 2회)",
    posted: "2026-02-28",
    deadline: "2026-03-20",
    description:
      "판교 테크노밸리 소재 IT빌딩의 전기 설비 정기 점검 업무입니다. 분전반, 조명, 비상전원 등을 정기적으로 점검합니다.",
    requirements: [
      "전기기사 자격증 필수",
      "상업시설 점검 경험 3년 이상",
      "주말 근무 가능자",
    ],
    benefits: ["교통비 지원", "식대 제공", "장기 계약 가능"],
    applicants: 8,
  },
  {
    id: "j3",
    title: "송파 아파트 리모델링 인테리어",
    company: "드림홈인테리어",
    companyLogo: "🏠",
    location: "서울 송파구",
    salary: "일 30만원",
    type: "단기 (3주)",
    posted: "2026-03-02",
    deadline: "2026-03-18",
    description:
      "32평 아파트 전체 리모델링 프로젝트입니다. 도배, 타일, 바닥재 교체를 포함한 종합 인테리어 작업입니다.",
    requirements: [
      "인테리어 경력 3년 이상",
      "도배/타일 동시 가능자 우대",
      "포트폴리오 제출",
    ],
    benefits: ["자재비 별도", "식대 제공", "추가 근무 시 수당"],
    applicants: 15,
  },
  {
    id: "j4",
    title: "인천 물류센터 철골 구조물 설치",
    company: "대한철강건설",
    companyLogo: "🏭",
    location: "인천 서구",
    salary: "일 50만원",
    type: "중기 (2개월)",
    posted: "2026-02-25",
    deadline: "2026-03-10",
    description:
      "대형 물류센터 신축 현장의 철골 구조물 설치 작업입니다. 안전 교육 이수 필수이며, 팀 단위로 작업합니다.",
    requirements: [
      "철근공 경력 10년 이상",
      "고소 작업 가능자",
      "안전교육 이수증",
    ],
    benefits: ["숙소 제공", "3식 제공", "안전보험 가입"],
    applicants: 6,
  },
];

export const chatRooms: ChatRoom[] = [
  {
    id: "c1",
    name: "한양건설 김부장",
    avatar: "🏗️",
    lastMessage: "내일 현장 미팅 10시에 가능하신가요?",
    time: "오후 2:30",
    unread: 2,
    online: true,
  },
  {
    id: "c2",
    name: "테크파크건설",
    avatar: "🏢",
    lastMessage: "견적서 확인했습니다. 진행하겠습니다.",
    time: "오후 1:15",
    unread: 0,
    online: false,
  },
  {
    id: "c3",
    name: "드림홈인테리어 박사장",
    avatar: "🏠",
    lastMessage: "자재 샘플 보내드렸어요. 확인 부탁드립니다.",
    time: "오전 11:20",
    unread: 1,
    online: true,
  },
  {
    id: "c4",
    name: "대한철강건설",
    avatar: "🏭",
    lastMessage: "안전교육 일정 조율하겠습니다.",
    time: "어제",
    unread: 0,
    online: false,
  },
];

export const messages: Message[] = [
  { id: "m1", roomId: "c1", sender: "other", text: "안녕하세요, 김철수 기술자님!", time: "오후 2:00" },
  { id: "m2", roomId: "c1", sender: "other", text: "강남 오피스텔 배관 교체 건으로 연락드립니다.", time: "오후 2:01" },
  { id: "m3", roomId: "c1", sender: "me", text: "안녕하세요! 네, 공고 확인했습니다.", time: "오후 2:10" },
  { id: "m4", roomId: "c1", sender: "me", text: "30세대 규모면 2주 일정 가능할 것 같습니다.", time: "오후 2:11" },
  { id: "m5", roomId: "c1", sender: "other", text: "좋습니다! 현장 방문 한 번 해주시면 좋겠는데요.", time: "오후 2:25" },
  { id: "m6", roomId: "c1", sender: "other", text: "내일 현장 미팅 10시에 가능하신가요?", time: "오후 2:30" },
];

export const reviews: Review[] = [
  {
    id: "r1",
    workerName: "김철수",
    workerAvatar: "👷",
    companyName: "한양건설",
    rating: 5,
    categories: [
      { label: "기술력", score: 5 },
      { label: "시간 준수", score: 5 },
      { label: "의사소통", score: 4 },
      { label: "현장 정리", score: 5 },
    ],
    comment:
      "배관 교체 작업을 깔끔하게 마무리해주셨습니다. 약속 시간도 정확히 지키고, 작업 후 현장 정리도 완벽했습니다.",
    date: "2026-02-20",
  },
  {
    id: "r2",
    workerName: "이영희",
    workerAvatar: "👷‍♀️",
    companyName: "테크파크건설",
    rating: 5,
    categories: [
      { label: "기술력", score: 5 },
      { label: "시간 준수", score: 5 },
      { label: "의사소통", score: 5 },
      { label: "현장 정리", score: 4 },
    ],
    comment:
      "전기 설비 점검을 꼼꼼하게 진행해주셨어요. 문제점을 사전에 발견하고 보고해주셔서 큰 사고를 예방할 수 있었습니다.",
    date: "2026-02-15",
  },
];

export const workerStats = {
  totalEarnings: 12500000,
  completedJobs: 23,
  averageRating: 4.8,
  profileViews: 156,
  thisMonth: { earnings: 3200000, jobs: 5 },
};

export const companyStats = {
  activePostings: 4,
  totalApplicants: 41,
  contractsInProgress: 3,
  completedProjects: 28,
  totalSpent: 45000000,
  thisMonth: { postings: 2, hires: 3 },
};
