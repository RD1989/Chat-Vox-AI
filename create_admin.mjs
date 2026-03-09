import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nyxysqxqayhsxnqqoazd.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55eHlzcXhxYXloc3hucXFvYXpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA2NzQyMSwiZXhwIjoyMDg4NjQzNDIxfQ.0HNxaWs9iGBe1ymvRWEYB4tL62EptIuEvpbMMAXjFMo'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function createAdmin() {
    const email = 'rodrigotechpro@gmail.com'
    const password = 'RodrigoGomes1989'

    console.log(`Tentando criar usuário: ${email}`)

    // 1. Criar o usuário no Auth
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Super Admin' }
    })

    if (error) {
        if (error.message.includes('already registered')) {
            console.log('Usuário já existe no Auth. Verificando roles...')
            // Buscar o ID do usuário existente
            const { data: users } = await supabase.auth.admin.listUsers()
            const existingUser = users.users.find(u => u.email === email)
            if (existingUser) {
                await assignRole(existingUser.id)
            }
        } else {
            console.error('Erro ao criar usuário:', error.message)
        }
        return
    }

    console.log('Usuário criado com sucesso:', data.user.id)
    await assignRole(data.user.id)
}

async function assignRole(userId) {
    // 2. Atribuir a role 'admin' na tabela public.user_roles
    const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' })

    if (roleError) {
        console.error('Erro ao atribuir role admin:', roleError.message)
    } else {
        console.log('Role "admin" atribuída com sucesso!')
    }
}

createAdmin()
