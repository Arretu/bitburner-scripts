import { batchArgs, tPrep, getHosts,getMinRam } from "/scripts/local/lib.js"
/** @param {NS} ns */
export async function main(ns) {
	ns.tail()
	ns.disableLog('getServerMaxRam')
	ns.disableLog('sleep')
	ns.disableLog('scp')
	ns.disableLog('exec')
	ns.disableLog('getServerUsedRam')
	await ns.sleep(500)
	while (true) {
		const targetList = ns.read("/data/targetList.txt").split(",")
		const target = targetList[0]
		const hTime = ns.getHackTime(target)
		const gDelay = hTime * 0.8
		const hDelay = 3 * hTime;
		const sHosts = getHosts(ns)
		const minRam = getMinRam(ns,sHosts)
		ns.print("tprep")
		await ns.sleep(500)
		await tPrep(ns, sHosts, target)
		ns.print("tprep done")
		await ns.sleep(500)
		const [hThreads, gThreads, wThreads, bRam] = batchArgs(ns, target, minRam);
		let batchCount = 0
		const rHosts = []
		for (const sHost of sHosts) {
			let batchNum = Math.floor(ns.getServerMaxRam(sHost) / bRam)
			batchCount = batchCount +
				rHosts.push([sHost, batchNum*3])
		}
		let neededLaunches = 3*batchCount
		let cacheTime = Date.now()
		let lastLaunched = "w"
		let launchCount = 0;
		let pid
		let rHostName
		ns.print("Ready to launch " + batchCount + " batches with HGW threads: "+hThreads+" | "+gThreads+" | "+wThreads)
		await ns.sleep(100);
		for (const rHost of rHosts) {
			let thisHostCount = rHost[1]
			rHostName = rHost[0]
			for (let i = 0; i < thisHostCount; i++) {
				launchCount++
				if (launchCount == batchCount) {
					pid = ns.exec("/scripts/remote/weaken.js", rHostName, wThreads, 0, target)
				}
				else if (lastLaunched == "w") {
					ns.exec("/scripts/remote/hack.js", rHostName, hThreads, hDelay, target)
					lastLaunched == "h"
				}
				else if (lastLaunched == "h") {
					ns.exec("/scripts/remote/grow.js", rHostName, gThreads, gDelay, target)
					lastLaunched == "g"
				}
				else if (lastLaunched == "w") {
					ns.exec("/scripts/remote/weaken.js", rHostName, wThreads, 0, target)
					lastLaunched == "w"
				}
				if (Date.now() >= cacheTime + 500) {
					await ns.sleep(50)
					cacheTime = Date.now()
				}
			}
		}
		while (ns.isRunning(pid, rHostName)) await ns.sleep(200)
	}
}