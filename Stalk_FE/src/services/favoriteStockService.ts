import AuthService from "./authService";

class FavoriteStockService {
  static async getFavoriteStocks(): Promise<any> {
    const token = AuthService.getAccessToken();
    if (!token) throw new Error("로그인이 필요합니다.");

    const response = await fetch(`/api/favorites`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("관심 종목 목록을 불러오는데 실패했습니다.");
    }

    return response.json();
  }

  static async addFavoriteStock(ticker: string): Promise<void> {
    const token = AuthService.getAccessToken();
    if (!token) throw new Error("로그인이 필요합니다.");

    const response = await fetch(`/api/favorites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ticker }),
    });

    if (!response.ok) {
      throw new Error("관심 종목 추가에 실패했습니다.");
    }
  }

  static async removeFavoriteStock(ticker: string): Promise<void> {
    const token = AuthService.getAccessToken();
    if (!token) throw new Error("로그인이 필요합니다.");

    const response = await fetch(`/api/favorites/${ticker}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("관심 종목 삭제에 실패했습니다.");
    }
  }
}

export default FavoriteStockService;
