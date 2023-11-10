/** @param {NS} ns */
export async function main(ns) {
	
	
	let file = ns.args[0];
	let client = ns.args[1];
	//ns.print(file);
	//ns.print(client);

	ns.scp(file,client);

}