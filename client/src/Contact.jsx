import Avatar from "./Avatar";

export default function Contact({ id, username, onClick, selected, online }) {
	return (
		<div
			key={id}
			onClick={() => onClick(id)}
			className={
				"border-b border-gray-200 flex gap-2 items-center cursor-pointer " +
				(selected ? "bg-blue-200" : "")
			}
		>
			{selected && <div className="w-1 bg-blue-500 h-12 rounded-r-md"></div>}
			<div className="flex items-center gap-2 py-2 pl-4">
				<Avatar online={online} username={username} userId={id} />
				<span className="text-gray-600">{username}</span>
			</div>
		</div>
	);
}
