import axios from "axios";
import { serverApi } from "../lib/config";
import { clearAdminSession, setAdminToken } from "../lib/adminAuth";
import { MemberType } from "../lib/enums/member.enum";
import { Member, MemberUpdateInput, UserInquiry, LoginInput, MemberInput } from "../lib/types/member";

const isHtmlResponse = (data: unknown): boolean =>
  typeof data === "string" && data.trim().toLowerCase().startsWith("<!doctype html");

class MemberService {
  private readonly path: string;

  constructor() {
    this.path = serverApi;
  }

  public async signup(input: MemberInput): Promise<Member> {
    try {
      const url = this.path + "/member/signup";
      const result = await axios.post(url, input, { withCredentials: true });
      if (isHtmlResponse(result.data)) {
        console.error("Signup so'rovi HTML qaytardi. URL:", url);
        throw new Error(
          `Backend API ga ulanishda xato. So'rov ${url} ga yuborildi. REACT_APP_API_URL to'g'ri ekanini tekshiring va qayta build qiling.`
        );
      }
      const member = result.data?.member ?? result.data?.user ?? result.data;
      if (!member || !member._id) {
        throw new Error(result.data?.message || "Ro'yxatdan o'tish muvaffaqiyatsiz.");
      }
      setAdminToken(result.data?.accessToken);
      localStorage.setItem("memberData", JSON.stringify(member));
      return member;
    } catch (err) {
      console.log("Error, signup:", err);
      throw err;
    }
  }

  public async getUsers(input: UserInquiry): Promise<Member[]> {
    try {
      let url = `${this.path}/admin/user/all?page=${input.page}&limit=${input.limit}`;
      if (input.search) url += `&search=${input.search}`;
      if (input.status) url += `&status=${input.status}`;
      const result = await axios.get(url, { withCredentials: true });
      console.log("getUsers: ", result);
      return result.data;
    } catch (err) {
      console.log("Error, getUsers:", err);
      throw err;
    }
  }

  public async updateChosenUser(input: MemberUpdateInput): Promise<Member> {
    try {
      const url = `${this.path}/admin/user/edit`;
      const result = await axios.post(url, input, { withCredentials: true });
      console.log("updateChosenUser: ", result);
      return result.data;
    } catch (err) {
      console.log("Error, updateChosenUser:", err);
      throw err;
    }
  }

  public async login(input: LoginInput): Promise<Member> {
    try {
      const url = this.path + "/member/login";
      const result = await axios.post(url, input, { withCredentials: true });
      if (isHtmlResponse(result.data)) {
        throw new Error(
          "Backend API ga ulanishda xato. REACT_APP_API_URL to'g'ri backend manzilini ko'rsatishi kerak (masalan: http://38.247.134.248:3000). 4009 porti frontend uchun bo'lishi mumkin."
        );
      }
      const member = result.data?.member ?? result.data?.user ?? result.data;
      if (!member || !member._id) {
        throw new Error(result.data?.message || "Login muvaffaqiyatsiz.");
      }
      // Admin panelga faqat restoran (admin) akkaunti kiradi
      if (member.memberType !== MemberType.RESTAURANT) {
        throw { response: { data: { message: "Bu akkaunt admin emas" } } };
      }
      setAdminToken(result.data?.accessToken);
      localStorage.setItem("memberData", JSON.stringify(member));
      return member;
    } catch (err) {
      console.log("Error, login:", err);
      throw err;
    }
  }

  public async logout(): Promise<void> {
    // Server javob bermasa ham lokal sessiya tozalanadi
    clearAdminSession();
    try {
      const url = this.path + "/member/logout";
      const result = await axios.post(url, {}, { withCredentials: true });
      console.log("logout:", result);
      clearAdminSession();
    } catch (err) {
      console.log("Error, logout:", err);
      throw err;
    }
  }
}

export default MemberService;
