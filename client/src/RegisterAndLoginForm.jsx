import axios from "axios";
import { useContext, useState } from "react";
import { UserContext } from "./UserContext";

export default function RegisterAndLoginForm() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [isLoginOrRegister, setIsLoginOrRegister] = useState("login");
	const { setUsername: setLoggedInUsername, setId } = useContext(UserContext);

	async function handleSubmit(e) {
		e.preventDefault();
		const url = isLoginOrRegister === "login" ? "login" : "register";
		const { data } = await axios.post(url, { username, password });
		setLoggedInUsername(username);
		setId(data.id);
	}

	return (
		<div className="bg-blue-50 h-screen flex items-center">
			<form className="w-64 mx-auto mb-12" onSubmit={handleSubmit}>
				<input
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					className="block w-full rounded-sm p-2 mb-2 border"
					type="text"
					placeholder="username"
				/>
				<input
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className="block w-full rounded-sm p-2 mb-2 border"
					type="password"
					placeholder="password"
				/>
				<button className="bg-blue-500 text-white block w-full rounded-md p-2">
					{isLoginOrRegister === "login" ? "Login" : "Register"}
				</button>
				<div className="text-center mt-2">
					{isLoginOrRegister === "register" ? (
						<div>
							Already have an account?{" "}
							<button onClick={() => setIsLoginOrRegister("login")}>
								Login
							</button>
						</div>
					) : (
						<div>
							Don't have an account?{" "}
							<button onClick={() => setIsLoginOrRegister("register")}>
								Register
							</button>
						</div>
					)}
				</div>
			</form>
		</div>
	);
}
