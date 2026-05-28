<template>
  <div class="container-fluid wall overflow-auto" style="min-height: 700px;">
    <div class="row justify-content-center">
      <div class="col-12 col-md-11 col-lg-10 mt-3 mb-3">
        <div class="card shadow bg-white">

          <!-- Header -->
          <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Manage Departments</h5>
            <button class="btn btn-light btn-sm" @click="$router.go(-1)">
              <i class="bi bi-arrow-left me-1"></i>Back
            </button>
          </div>

          <div class="card-body p-3 p-md-4">

            <!-- Loading -->
            <div v-if="loading" class="loading-container">
              <div class="spinner-border text-primary"></div>
              <p class="mt-2">Loading...</p>
            </div>

            <div v-else>

              <!-- Add Department Form -->
              <div class="mb-4 border rounded p-3 bg-light">
                <h6 class="mb-3">Add Department</h6>
                <div class="row g-2 align-items-end">
                  <div class="col-12 col-md-4">
                    <input
                      v-model.trim="newDept.name"
                      class="form-control"
                      placeholder="Department name"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <input
                      v-model.trim="newDept.description"
                      class="form-control"
                      placeholder="Description"
                    />
                  </div>
                  <div class="col-12 col-md-2">
                    <button
                      class="btn btn-success w-100"
                      @click="addDepartment"
                      :disabled="adding"
                    >
                      {{ adding ? 'Adding...' : 'Add' }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Departments Table -->
              <div class="table-responsive table-scroll-xl">
                <table class="table table-striped table-bordered">
                  <thead class="table-dark sticky-top">
                    <tr>
                      <th style="width: 8%;">ID</th>
                      <th style="width: 22%;">Name</th>
                      <th>Description</th>
                      <th style="width: 22%;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="d in departments" :key="d.id">
                      <td>{{ d.id }}</td>

                      <!-- Name -->
                      <td>
                        <input v-if="d._edit" v-model.trim="d._name" class="form-control form-control-sm" />
                        <span v-else>{{ d.name }}</span>
                      </td>

                      <!-- Description -->
                      <td>
                        <input v-if="d._edit" v-model.trim="d._description" class="form-control form-control-sm" />
                        <span v-else>{{ d.description }}</span>
                      </td>

                      <!-- Actions -->
                      <td class="text-nowrap">
                        <div class="d-flex align-items-center gap-2 flex-wrap">
                          <template v-if="!d._edit">
                            <button class="btn btn-primary btn-sm" @click="startEdit(d)">Edit</button>
                          </template>
                          <template v-else>
                            <button class="btn btn-success btn-sm" @click="saveEdit(d)">Save</button>
                            <button class="btn btn-secondary btn-sm" @click="cancelEdit(d)">Cancel</button>
                          </template>
                          <button
                            class="btn btn-danger btn-sm"
                            @click="deleteDepartment(d.id)"
                            :disabled="deletingId === d.id"
                          >
                            {{ deletingId === d.id ? 'Deleting...' : 'Delete' }}
                          </button>
                        </div>
                      </td>
                    </tr>

                    <tr v-if="departments.length === 0">
                      <td colspan="4" class="text-center text-muted py-3">No departments found</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/utils/api'

export default {
  setup() {
    const router = useRouter()
    const loading = ref(true)
    const adding = ref(false)
    const deletingId = ref(null)
    const departments = ref([])
    const newDept = ref({ name: '', description: '' })

    async function loadDepartments() {
      loading.value = true
      try {
        const { data } = await api.get('/api/departments')
        departments.value = Array.isArray(data)
          ? data.map(d => ({ ...d, _edit: false }))
          : []
      } catch (err) {
        console.error(err)
        alert('Failed to load departments')
        departments.value = []
      } finally {
        loading.value = false
      }
    }

    async function addDepartment() {
      if (!newDept.value.name || !newDept.value.description) {
        alert('Name and description are required')
        return
      }
      adding.value = true
      try {
        await api.post('/api/departments', {
          name: newDept.value.name,
          description: newDept.value.description
        })
        newDept.value = { name: '', description: '' }
        await loadDepartments()
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to add department')
      } finally {
        adding.value = false
      }
    }

    function startEdit(d) {
      d._edit = true
      d._name = d.name
      d._description = d.description
    }

    function cancelEdit(d) {
      d._edit = false
      delete d._name
      delete d._description
    }

    async function saveEdit(d) {
      const payload = {}
      if (d._name !== d.name) payload.name = d._name
      if (d._description !== d.description) payload.description = d._description
      if (Object.keys(payload).length === 0) {
        cancelEdit(d)
        return
      }
      try {
        await api.put(`/api/department/${d.id}`, payload)
        d.name = d._name
        d.description = d._description
        cancelEdit(d)
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to update department')
      }
    }

    async function deleteDepartment(id) {
      if (!confirm('Delete this department?')) return
      deletingId.value = id
      try {
        await api.delete(`/api/department/${id}`)
        departments.value = departments.value.filter(d => d.id !== id)
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete department')
      } finally {
        deletingId.value = null
      }
    }

    onMounted(loadDepartments)

    return {
      loading, adding, deletingId,
      departments, newDept,
      addDepartment,
      startEdit, cancelEdit, saveEdit,
      deleteDepartment
    }
  }
}
</script>
