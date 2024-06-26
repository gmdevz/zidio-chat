import axios from "axios";
import Routes from "./Routes";
import { UserContextProvider } from "./UserContext";

function App() {
	const isProduction = process.env.NODE_ENV === "production";

	// Set the base URL based on the environment
	axios.defaults.baseURL = isProduction
		? "https://zidio-chat-three.vercel.app/" // Replace with your Vercel deployment URL
		: "http://localhost:4040";
	axios.defaults.withCredentials = true;

	return (
		<UserContextProvider>
			<Routes />
		</UserContextProvider>
	);
}

export default App;
