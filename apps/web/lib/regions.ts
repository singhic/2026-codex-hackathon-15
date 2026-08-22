export const regions = [
  { code: "SEOUL-JONGNO", label: "서울 종로구" },
  { code: "SEOUL-JUNG", label: "서울 중구" },
  { code: "SEOUL-YONGSAN", label: "서울 용산구" },
  { code: "SEOUL-SEONGDONG", label: "서울 성동구" },
  { code: "SEOUL-GWANGJIN", label: "서울 광진구" },
  { code: "SEOUL-DONGDAEMUN", label: "서울 동대문구" },
  { code: "SEOUL-JUNGNANG", label: "서울 중랑구" },
  { code: "SEOUL-SEONGBUK", label: "서울 성북구" },
  { code: "SEOUL-GANGBUK", label: "서울 강북구" },
  { code: "SEOUL-DOBONG", label: "서울 도봉구" },
  { code: "SEOUL-NOWON", label: "서울 노원구" },
  { code: "SEOUL-EUNPYEONG", label: "서울 은평구" },
  { code: "SEOUL-SEODAEMUN", label: "서울 서대문구" },
  { code: "SEOUL-MAPO", label: "서울 마포구" },
  { code: "SEOUL-YANGCHEON", label: "서울 양천구" },
  { code: "SEOUL-GANGSEO", label: "서울 강서구" },
  { code: "SEOUL-GURO", label: "서울 구로구" },
  { code: "SEOUL-GEUMCHEON", label: "서울 금천구" },
  { code: "SEOUL-YEONGDEUNGPO", label: "서울 영등포구" },
  { code: "SEOUL-DONGJAK", label: "서울 동작구" },
  { code: "SEOUL-GWANAK", label: "서울 관악구" },
  { code: "SEOUL-SEOCHO", label: "서울 서초구" },
  { code: "SEOUL-GANGNAM", label: "서울 강남구" },
  { code: "SEOUL-SONGPA", label: "서울 송파구" },
  { code: "SEOUL-GANGDONG", label: "서울 강동구" },
] as const

export type RegionCode = (typeof regions)[number]["code"]

const regionLabels = new Map<string, string>(
  regions.map((region) => [region.code, region.label])
)

export function getRegionLabel(regionCode: string | null | undefined) {
  if (!regionCode) return ""
  return regionLabels.get(regionCode) ?? regionCode
}
