import express, { NextFunction, Request, Response} from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db";
import jwt, { JwtPayload } from "jsonwebtoken"
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());

function isJwtPayload(decoded: unknown): decoded is JwtPayload {
    return typeof decoded === "object" && decoded !== null
}



app.use(
    cors({
        origin: "http://localhost:3001" ,
        credentials: true
    })
);

const JWT_SECRET = process.env.JWT_SECRET || "default_secret"

app.get("/", (req: Request, res: Response) => {
    res.send("サーバが起動しています。")
});

app.post("/login", async (req: Request, res: Response) =>{
    const {email, password } = req.body;

    console.log("受け取ったデータ", email, password);

    try {
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1 AND password_hash = $2",
            [email, password]
        );

        if (result.rows.length === 0){
            return res.status(401).json({ message: "メールアドレスまたはパスワードが不正です", success: false});
        }

        const user = result.rows[0];
        // JWTトークンを発行（payloadにはユーザIDなどを入れる）
        const token = jwt.sign(
            { userID: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: "1h"}
        );

        return res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 3600*1000
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error"})
    }
});



// ------------------------------------
// JWT認証を行うミドルウェア
// ------------------------------------
function authenticateToken(req: Request, res: Response, next: NextFunction){
    const authHeader = (req.header as any)["authorization"];
    const token = authHeader && authHeader.split(" ")[1]

    if (!token){
        return res.status(401).json({ message: "トークンがありません" });
    }

    jwt.verify(token, JWT_SECRET, (err: jwt.VerifyErrors | null, decoded: JwtPayload | string | undefined) => {
        if (err) return res.status(403).json({ message: "トークンが無効です"});

        if (!isJwtPayload(decoded)) {
            return res.status(403).json({ message: "トークンの形式が無効です"})
        }

        req.user = decoded;
        next();
    });
}

// ------------------------------------
// 認証が必要なAPI例
// ------------------------------------
app.get("/profile", authenticateToken, async (req: Request, res: Response) => {
    const user = req.user;
    res.json({ message: "プロフィール情報", user });
  });



const PORT = process.env.PORT || 3002; // .envで指定されていればそちらを使う
app.listen(PORT, () => {
  console.log(`✅ サーバーが起動しました: http://localhost:${PORT}`);
});