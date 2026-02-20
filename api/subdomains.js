export default async function handler(req, res) {
    const token = process.env.VERCEL_API_TOKEN;
    if (!token) {
        return res.status(500).json({ error: "Missing VERCEL_API_TOKEN" });
    }

    const teamId = "team_I3FKyz3joKVayClxZAvCYHmj"; // Nathan Puls team id

    try {
        // Fetch all projects
        const response = await fetch(`https://api.vercel.com/v9/projects?teamId=${teamId}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await response.json();

        if (!data.projects) {
            return res.status(500).json({ error: "Failed to fetch projects" });
        }

        const builtAtSubdomains = [];

        // Check each project for domains ending with .built.at
        // Using Promise.all for concurrent fetching to be fast!
        await Promise.all(data.projects.map(async (project) => {
            try {
                const domainRes = await fetch(`https://api.vercel.com/v9/projects/${project.name}/domains?teamId=${teamId}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                const domainData = await domainRes.json();

                if (domainData.domains) {
                    for (const d of domainData.domains) {
                        if (d.name.endsWith(".built.at") && d.name !== "built.at") {
                            // Format: Capitalize first letter of subdomain for display name
                            const host = d.name.replace(".built.at", "");
                            const displayName = host.charAt(0).toUpperCase() + host.slice(1);

                            builtAtSubdomains.push({
                                name: displayName,
                                url: `https://${d.name}`
                            });
                        }
                    }
                }
            } catch (err) {
                console.error(`Failed to fetch domains for ${project.name}`, err);
            }
        }));

        // Sort alphabetically
        builtAtSubdomains.sort((a, b) => a.name.localeCompare(b.name));

        // Let's add the root domain manually as the first item if desired
        // builtAtSubdomains.unshift({ name: "Main", url: "https://built.at" });

        // Cache this endpoint for 1 hour since Vercel info doesn't change every second
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
        res.status(200).json({ subdomains: builtAtSubdomains });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}
