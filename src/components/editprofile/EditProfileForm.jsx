import { toast } from "sonner";
import { Save } from "lucide-react";
import ProfileImageUpload from "./ProfileImageUpload";
import { useState } from "react";

export default function EditProfileForm({ onProfileUpdate, currentUser }) {

    const [formData, setFormData] = useState({
        coverImage: currentUser.coverImage,
        avatar: currentUser.avatar,
        name: currentUser.name,
        username: currentUser.username,
        role: currentUser.role,
        location: currentUser.location,
        website: currentUser.website,
        dateOfBirth: currentUser.dateOfBirth,
        bio: currentUser.bio,
        skills: (currentUser.skills || []).join(", "),
    });

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((currentData) => ({
            ...currentData,
            [name]: value,
        }));
    }

    function handleSubmit(event) {
        event.preventDefault();
        onProfileUpdate({
            ...formData,
            skills: formData.skills
                .split(",")
                .map((skill) => skill.trim())
                .filter(Boolean),
        });
        toast.success("Profile updated successfully");
    }
    

    return (
        <section className="content-card-padded">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div>
                    <ProfileImageUpload
                        variant="cover"
                        imageSrc={formData.coverImage}
                        originalImageSrc={currentUser.coverImage}
                        onImageChange={(imageUrl) => setFormData((currentData) => ({ ...currentData, coverImage: imageUrl }))}
                        alt="Profile Cover"
                    />

                    <ProfileImageUpload
                        variant="avatar"
                        imageSrc={formData.avatar}
                        originalImageSrc={currentUser.avatar}
                        onImageChange={(imageUrl) => setFormData((currentData) => ({ ...currentData, avatar: imageUrl }))}
                        alt="Profile Avatar"
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="display-name" className="type-body-sm text-(--primary)">
                            Display Name
                        </label>

                        <input
                            id="display-name"
                            name="name"
                            type="text"
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={handleChange}
                            className="input-surface type-body-sm w-full rounded-lg px-4 py-3 text-primary outline-none placeholder:text-(--text-secondary)"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="username" className="type-body-sm text-(--primary)">
                            Username
                        </label>

                        <input
                            id="username"
                            name="username"
                            type="text"
                            placeholder="Username"
                            value={formData.username}
                            onChange={handleChange}
                            className="input-surface type-body-sm w-full rounded-lg px-4 py-3 text-primary outline-none placeholder:text-(--text-secondary)"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="role" className="type-body-sm text-(--primary)">
                            Role
                        </label>

                        <input
                            id="role"
                            name="role"
                            type="text"
                            placeholder="Role"
                            value={formData.role}
                            onChange={handleChange}
                            className="input-surface type-body-sm w-full rounded-lg px-4 py-3 text-primary outline-none placeholder:text-(--text-secondary)"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="location" className="type-body-sm text-(--primary)">
                            Location
                        </label>

                        <input
                            id="location"
                            name="location"
                            type="text"
                            placeholder="Location"
                            value={formData.location}
                            onChange={handleChange}
                            className="input-surface type-body-sm w-full rounded-lg px-4 py-3 text-primary outline-none placeholder:text-(--text-secondary)"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="website" className="type-body-sm text-(--primary)">
                            Website
                        </label>

                        <input
                            id="website"
                            name="website"
                            type="text"
                            placeholder="Website"
                            value={formData.website}
                            onChange={handleChange}
                            className="input-surface type-body-sm w-full rounded-lg px-4 py-3 text-primary outline-none placeholder:text-(--text-secondary)"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="date-of-birth" className="type-body-sm text-(--primary)">
                            Date Of Birth
                        </label>
                        <input
                            id="date-of-birth"
                            name="dateOfBirth"
                            type="date"
                            placeholder="Date Of Birth"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                            className="input-surface type-body-sm w-full rounded-lg px-4 py-3 text-primary outline-none placeholder:text-(--text-secondary)"
                        />
                    </div>

                    <div className="flex flex-col gap-2 md:col-span-2">
                        <label htmlFor="skills" className="type-body-sm text-(--primary)">
                            Skills & Interests
                        </label>

                        <input
                            id="skills"
                            name="skills"
                            type="text"
                            placeholder="React, UI Design, Accessibility"
                            value={formData.skills}
                            onChange={handleChange}
                            className="input-surface type-body-sm w-full rounded-lg px-4 py-3 text-primary outline-none placeholder:text-(--text-secondary)"
                        />

                        <p className="type-label-sm text-secondary">
                            Separate each skill or interest with a comma.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 md:col-span-2">
                        <label htmlFor="bio" className="type-body-sm text-(--primary)">
                            Bio
                        </label>

                        <textarea
                            id="bio"
                            name="bio"
                            placeholder="Bio"
                            value={formData.bio}
                            onChange={handleChange}
                            rows={4}
                            className="input-surface type-body-sm w-full resize-none rounded-lg px-4 py-3 text-primary outline-none placeholder:text-(--text-secondary)"
                        />
                    </div>
                </div>

                <button type="submit" className="button-primary mx-auto flex w-50 items-center justify-center gap-2 p-3">
                    <Save size={18} />
                    Save Changes
                </button>
            </form>
        </section>
    );
}
