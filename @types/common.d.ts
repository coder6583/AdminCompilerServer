interface loginResult {
	success: boolean;
	userData: userData;
}

interface userData {
	id: string;
	username: string;
	avatar: string;
	email: string;
}

interface loadedProject {
	value: dirObject;
}

interface dirObject {
	type: 'file' | 'folder';
	name: string;
	value?: dirObject[];
}

interface saveResult {
	value: string;
	style: 'info' | 'err';
}

interface compileData
{
	filename: string;
	value: string;
}

interface saveData
{
	projectName: string;
	filename: string;
	value: string;
}

interface loginData
{
	accountName: string;
}

interface loadProjectData
{
	projectName: string;
}

interface createProjectData
{
	projectName: string;
}

interface serverLog {
	server: string,
	category: string;
	title: string;
	value: string[];
	timestamp: number;
}

interface banIP {
	ip: string;
	memo: string;
	timestamp: number;
}

interface logFilter {
	keyword: string[],
	category: string[],
	server: string[],
	before: number | undefined,
	after: number | undefined
}