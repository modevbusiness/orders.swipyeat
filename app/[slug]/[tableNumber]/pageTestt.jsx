'use client'
import { supabase } from "@/lib/supabase"
import { useState, useEffect } from 'react'

export default function Page() {
    
    const [orders, setOrders] = useState([])

    useEffect(() => {
        console.log("Setting up realtime subscription...")
        let channel = null

        try {
            channel = supabase
                .channel('orders-channel1')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'orders'
                    },
                    (payload) => {
                        try {
                            console.log('New order inserted!', payload)
                            
                        } catch (err) {
                            console.error('Error processing order payload:', err)
                        }
                    }
                )
                .subscribe((status, err) => {
                    if (status === 'SUBSCRIBED') {
                        console.log('✅ Successfully subscribed to orders channel')
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error('❌ Channel error:', JSON.stringify(err))
                        console.error('Make sure: 1) Realtime is enabled on "orders" table, 2) RLS allows SELECT')
                    } else if (status === 'TIMED_OUT') {
                        console.error('❌ Subscription timed out')
                    } else {
                        console.log('📡 Subscription status:', status)
                    }
                })
        } catch (err) {
            console.error('Error setting up subscription:', JSON.stringify(err))
        }

        // Cleanup subscription on unmount
        return () => {
            if (channel) {
                console.log('Cleaning up subscription...')
                supabase.removeChannel(channel)
            }
        }
    }, [])

    console.log("jjjj")
    return (
        <div>
            {orders.map((order, index) => (
                <div key={index}>
                    <h3>Order Number: {order.order_number}</h3>
                    <p>Table: {order.table_number}</p>
                    <p>Total: {order.total_amount}</p>
                </div>
            ))}
        </div>
    )
}