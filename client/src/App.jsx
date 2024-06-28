import axios from "axios";
import Routes from "./Routes";
import { UserContextProvider } from "./UserContext";

function App() {
	axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
	axios.defaults.withCredentials = true;

	return (
		<UserContextProvider>
			<Routes />
		</UserContextProvider>
	);
}

export default App;
