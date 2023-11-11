import {pull} from "/scripts/shared/libs/lib.js";
/** @param {NS} ns */
export async function main(ns) {

	//Initial Setup
	let hostName = ns.getHostname();

	const cHosts = ns.read("/data/batcher/static/controlServers.txt").split(",");
	const g1Hosts = ns.read("/data/batcher/static/g1Servers.txt").split(",");
	const g2Hosts = ns.read("/data/batcher/static/g2Servers.txt").split(",");
	const g3Hosts = ns.read("/data/batcher/static/g3Servers.txt").split(",");
	const g4Hosts = ns.read("/data/batcher/static/g4Servers.txt").split(",");
	const g5Hosts = ns.read("/data/batcher/static/g5Servers.txt").split(",");

	let groupNum = cHosts.indexOf(hostName);
	

	if (groupNum == 0) {
		ns.write("/data/batcher/activeGroup.txt", g1Hosts.toString());
		ns.print("Active Group ",groupNum);
	} else if (groupNum == 1) {
		ns.write("/data/batcher/activeGroup.txt", g2Hosts.toString());
		ns.print("Active Group ",groupNum);
	} else if (groupNum == 2) {
		ns.write("/data/batcher/activeGroup.txt", g3Hosts.toString());
		ns.print("Active Group ",groupNum);
	} else if (groupNum == 3) {
		ns.write("/data/batcher/activeGroup.txt", g4Hosts.toString());
		ns.print("Active Group ",groupNum);
	} else if (groupNum == 4) {
		ns.write("/data/batcher/activeGroup.txt", g5Hosts.toString());
		ns.print("Active Group ",groupNum);
	} else {
		ns.print("Debug: Something went wrong.");
		return;
	}
	await pull(ns,"/data/currtargets.txt",hostName);
	await ns.sleep(1000);
	let groupInfo = [hostName,groupNum,ns.getServerMaxRam(hostName)];
	ns.mv(hostName,"/data/currtargets.txt","/data/old/currenttargets.txt");
	ns.print("Writing GroupInfo")
	ns.write("/data/batcher/static/groupInfo.txt",groupInfo.toString());

	
	await ns.sleep(5000);
	
	//Run the actual batcher, just have to make it >_>
	ns.exec("/scripts/shared/batcher/batcher-core.js",hostName,1,groupInfo.toString());
	ns.print("Batcher init complete. Starting batcher-core on control nodes.");
	
}