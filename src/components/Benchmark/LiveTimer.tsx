"use client";

import React, { useEffect, useState } from "react";

export const LiveTimer = ({ startedAt }: { startedAt: Date | string }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!startedAt) return;
        // Adjust for any small clock skew by not going below 0
        const start = new Date(startedAt).getTime();

        const interval = setInterval(() => {
            setElapsed(Math.max(0, Date.now() - start));
        }, 100);
        return () => clearInterval(interval);
    }, [startedAt]);

    return <span>{(elapsed / 1000).toFixed(1)}s</span>;
};
