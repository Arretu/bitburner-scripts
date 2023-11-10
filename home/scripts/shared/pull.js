//This script allows a server to make home copy files over.

/** @param {NS} ns */
export async function main(ns, file) {
	let client = ns.getHostname();

	ns.exec('/scripts/local/fileserver.js', 'home', 1, 'file', 'client');
	//ns.sleep(1000);
}
