import { NextRequest, NextResponse } from "next/server";
import cron from "node-cron";

export async function POST(request: NextRequest) {
    try {
        cron.schedule('*/5 * * * *', async () => {
            console.log('')
            console.log('######################################')
            console.log('#                                    #')
            console.log('# Running scheduler every 5 minutes #')
            console.log('#                                    #')
            console.log('######################################')
            console.log('')
        });

        return NextResponse.json({ data: 'Success', status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: "Task scheduler failed" }, { status: 500 })
    }
}
