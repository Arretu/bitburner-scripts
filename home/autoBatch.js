/** @param {NS} ns */
export async function main(ns) {

	//Prepare pServers for batching.
	const pServers = ns.getPurchasedServers();

	for (const host of pServers) {
		ns.killall(host);
		let files = ns.ls(host);
		for (const file of files) {
			let filestr = "/" + file;
			//ns.print("DEBUG: filestr = ", filestr);
			ns.rm(filestr, host);
		}
	}
	ns.tprint("Scripts stopped and files deleted on all personal servers.");
	await ns.sleep(1000);

	//Delete old batcher data.
	const oldFiles = ns.ls("home", "/data/batcher");
	for (const file of oldFiles) {
		ns.rm(file);
	}

	let controlServers = [];
	let g1Servers = [];
	let g2Servers = [];
	let g3Servers = [];
	let g4Servers = [];
	let g5Servers = [];
	let allgServers = [];

	for (let i = 0; i <= pServers.length; i++) {

		if (i <= 4) {
			controlServers.push(pServers[i]);
		}
		else if (i <= 8) {
			g1Servers.push(pServers[i]);
			allgServers.push(pServers[i]);
		}
		else if (i <= 12) {
			g2Servers.push(pServers[i]);
			allgServers.push(pServers[i]);
		}
		else if (i <= 16) {
			g3Servers.push(pServers[i]);
			allgServers.push(pServers[i]);
		}
		else if (i <= 20) {
			g4Servers.push(pServers[i]);
			allgServers.push(pServers[i]);
		}
		else if (i <= 24) {
			g5Servers.push(pServers[i]);
			allgServers.push(pServers[i]);
		}
	}
	ns.write("/data/batcher/static/controlServers.txt", controlServers.toString(), "w");
	ns.write("/data/batcher/static/g1Servers.txt", g1Servers.toString(), "w");
	ns.write("/data/batcher/static/g2Servers.txt", g2Servers.toString(), "w");
	ns.write("/data/batcher/static/g3Servers.txt", g3Servers.toString(), "w");
	ns.write("/data/batcher/static/g4Servers.txt", g4Servers.toString(), "w");
	ns.write("/data/batcher/static/g5Servers.txt", g5Servers.toString(), "w");
	ns.write("/data/batcher/static/allgservers.txt", allgServers.toString(), "w");

	await ns.sleep(500);

	//Deploy Shared stuff to control pServers

	//Filelists for control and work groups.
	let libFiles = ns.ls("home", "/scripts/shared/libs/");
	let batchScripts = ns.ls("home", "/scripts/shared/batcher/");
	let batchData = ns.ls("home", "/data/batcher/static/");
	let hackScripts = ns.ls("home", "/scripts/shared/hgw/");



	let fileListG = libFiles.concat(hackScripts);
	let fileListC = libFiles.concat(batchData, batchScripts);

	for (const host of allgServers) {
		for (const file of fileListG) {
			ns.scp(file, host);
		}
	}

	for (const host of controlServers) {
		for (const file of fileListC) {
			ns.scp(file, host);
		}
		ns.exec("/scripts/shared/batcher/batcher-init.js", host);
	}
	//ns.exec the thingy that controls the stuff

}
